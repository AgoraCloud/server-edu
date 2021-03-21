import {
  Workspace,
  WorkspaceDocument,
  WorkspaceSchema,
} from './../workspaces/schemas/workspace.schema';
import { User, UserDocument, UserSchema } from './../users/schemas/user.schema';
import {
  AuditLog,
  AuditLogSchema,
  AuditLogDocument,
} from './schemas/audit-log.schema';
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import {
  closeMongooseConnection,
  MongooseMockModule,
} from './../../../test/utils/mongoose-mock-module';
import { Connection, Model } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditingService } from './auditing.service';
import { Action } from '../authorization/schemas/permission.schema';

let user: UserDocument;
let workspace: WorkspaceDocument;
let auditLogId: string;

describe('AuditingService', () => {
  let service: AuditingService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: AuditLog.name, schema: AuditLogSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([
          { name: Workspace.name, schema: WorkspaceSchema },
        ]),
      ],
      providers: [AuditingService],
    }).compile();

    service = module.get<AuditingService>(AuditingService);
    connection = await module.get(getConnectionToken());

    // Create a user and workspace
    const userModel: Model<UserDocument> = module.get<Model<UserDocument>>(
      getModelToken(User.name),
    );
    user = await userModel.create({
      fullName: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
      isEnabled: true,
      isVerified: true,
    });
    const workspaceModel: Model<WorkspaceDocument> = module.get<
      Model<WorkspaceDocument>
    >(getModelToken(Workspace.name));
    workspace = await workspaceModel.create({
      name: 'Test Workspace',
      users: [user],
    });
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an audit log', async () => {
      const auditLog: AuditLog = new AuditLog({
        isSuccessful: true,
        actions: [Action.ManageUser],
        userAgent: 'PostmanRuntime/7.26.10',
        ip: '::1',
        user,
        workspace,
      });
      const createdAuditLog: AuditLogDocument = await service.create(auditLog);
      expect(createdAuditLog.isSuccessful).toBe(auditLog.isSuccessful);
      expect(createdAuditLog.actions).toHaveLength(1);
      expect(createdAuditLog.actions[0]).toBe(auditLog.actions[0]);
      expect(createdAuditLog.userAgent).toBe(auditLog.userAgent);
      expect(createdAuditLog.ip).toBe(auditLog.ip);
      expect(createdAuditLog.user._id).toEqual(user._id);
      expect(createdAuditLog.workspace._id).toBe(workspace._id);
      auditLogId = createdAuditLog._id;
    });
  });

  describe('findAll', () => {
    it('should find all audit logs', async () => {
      const retrievedAuditLogs: AuditLogDocument[] = await service.findAll(
        user._id.toString(),
        workspace._id.toString(),
      );
      expect(retrievedAuditLogs).toHaveLength(1);
      expect(retrievedAuditLogs[0]._id).toEqual(auditLogId);
      expect(retrievedAuditLogs[0].user._id).toEqual(user._id);
      expect(retrievedAuditLogs[0].workspace._id).toEqual(workspace._id);
    });
  });
});
