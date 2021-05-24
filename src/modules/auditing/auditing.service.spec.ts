import { AuditLogQueryParamsDto } from './dto/audit-log-query-params.dto';
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
import { AuditActionDto, AuditResourceDto } from '@agoracloud/common';

let user: UserDocument;
let workspace: WorkspaceDocument;
let auditLog: AuditLogDocument;

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
      const auditLogEntry: AuditLog = new AuditLog({
        isSuccessful: true,
        action: AuditActionDto.Create,
        resource: AuditResourceDto.Deployment,
        userAgent: 'PostmanRuntime/7.26.10',
        ip: '::1',
        user,
        workspace,
      });
      const createdAuditLog: AuditLogDocument = await service.create(
        auditLogEntry,
      );
      expect(createdAuditLog.isSuccessful).toBe(auditLogEntry.isSuccessful);
      expect(createdAuditLog.action).toBe(auditLogEntry.action);
      expect(createdAuditLog.resource).toBe(auditLogEntry.resource);
      expect(createdAuditLog.userAgent).toBe(auditLogEntry.userAgent);
      expect(createdAuditLog.ip).toBe(auditLogEntry.ip);
      expect(createdAuditLog.user._id).toEqual(user._id);
      expect(createdAuditLog.workspace._id).toBe(workspace._id);
      auditLog = createdAuditLog;
    });
  });

  describe('findAll', () => {
    it('should find all audit logs', async () => {
      const auditLogQueryParamsDto: AuditLogQueryParamsDto = {
        isSuccessful: `${auditLog.isSuccessful}`,
        action: auditLog.action,
        resource: auditLog.resource,
        userAgent: auditLog.userAgent,
        ip: auditLog.ip,
        userId: user._id.toString(),
        workspaceId: workspace._id.toString(),
        take: '10',
        skip: '0',
      };
      const retrievedAuditLogs: AuditLogDocument[] = await service.findAll(
        auditLogQueryParamsDto,
      );
      expect(retrievedAuditLogs).toHaveLength(1);

      const retrievedAuditLog: AuditLogDocument = retrievedAuditLogs[0];
      expect(retrievedAuditLog._id).toEqual(auditLog._id);
      expect(retrievedAuditLog.isSuccessful).toBe(auditLog.isSuccessful);
      expect(retrievedAuditLog.action).toBe(auditLog.action);
      expect(retrievedAuditLog.resource).toBe(auditLog.resource);
      expect(retrievedAuditLog.userAgent).toBe(auditLog.userAgent);
      expect(retrievedAuditLog.ip).toBe(auditLog.ip);
      expect(retrievedAuditLog.user._id).toEqual(user._id);
      expect(retrievedAuditLog.workspace._id).toEqual(workspace._id);
    });
  });
});
