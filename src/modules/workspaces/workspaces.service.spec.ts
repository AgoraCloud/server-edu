import { UserDeletedEvent } from './../../events/user-deleted.event';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceNotFoundException } from './../../exceptions/workspace-not-found.exception';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UserDocument } from '../users/schemas/user.schema';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from '../../../test/utils/mongoose-mock-module';
import { WorkspaceDocument, WorkspaceSchema } from './schemas/workspace.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  getConnectionToken,
  MongooseModule,
  getModelToken,
} from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { Connection, Types, Model } from 'mongoose';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
  isAdmin: false,
} as UserDocument;

let workspaceId: string;

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;
  let workspaceModel: Model<WorkspaceDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: 'Workspace', schema: WorkspaceSchema },
        ]),
      ],
      providers: [WorkspacesService, EventEmitter2],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    connection = await module.get(getConnectionToken());
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    workspaceModel = module.get<Model<WorkspaceDocument>>(
      getModelToken('Workspace'),
    );
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: 'Test Workspace',
      };
      const createdWorkspace: WorkspaceDocument = await service.create(
        user,
        createWorkspaceDto,
      );
      expect(createdWorkspace.name).toBe(createWorkspaceDto.name);
      expect(createdWorkspace.users[0]._id).toEqual(user._id);
      workspaceId = createdWorkspace._id;
    });
  });

  describe('findAll', () => {
    it('should find all the users workspaces', async () => {
      const retrievedWorkspaces: WorkspaceDocument[] = await service.findAll(
        user._id,
      );
      expect(retrievedWorkspaces).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the workspace with the given id was not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.findOne(user._id, workspaceId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the users workspace with the given id', async () => {
      const retrievedWorkspace: WorkspaceDocument = await service.findOne(
        user._id,
        workspaceId,
      );
      expect(retrievedWorkspace._id).toEqual(workspaceId);
      expect(retrievedWorkspace.users[0]._id).toEqual(user._id);
    });
  });

  describe('update', () => {
    it('should throw an error if the workspace with the given id was not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const updateWorkspaceDto: UpdateWorkspaceDto = {
        name: 'New Test Workspace',
      };
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.update(user._id, workspaceId, updateWorkspaceDto);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the users workspace', async () => {
      const updateWorkspaceDto: UpdateWorkspaceDto = {
        name: 'New Test Workspace',
      };
      const updatedWorkspace: WorkspaceDocument = await service.update(
        user._id,
        workspaceId,
        updateWorkspaceDto,
      );
      expect(updatedWorkspace._id).toEqual(workspaceId);
      expect(updatedWorkspace.name).toBe(updateWorkspaceDto.name);
    });
  });

  describe('remove', () => {
    it('should throw an error if the workspace with the given id was not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.remove(user._id, workspaceId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the users workspace', async () => {
      const eventEmitterSpy = jest.spyOn(eventEmitter, 'emit');
      await service.remove(user._id, workspaceId);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleUserDeletedEvent', () => {
    let createdWorkspace: WorkspaceDocument;

    beforeEach(async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: 'Test Workspace',
      };
      createdWorkspace = await service.create(user, createWorkspaceDto);
    });

    afterEach(async () => {
      await workspaceModel.deleteMany({}).exec();
    });

    it('should delete the workspace if the user is the only user in the workspace', async () => {
      const payload: UserDeletedEvent = new UserDeletedEvent(user._id);
      const serviceRemoveSpy = jest.spyOn(service, 'remove');
      await service.handleUserDeletedEvent(payload);
      expect(serviceRemoveSpy).toBeCalledTimes(1);
    });

    it('should remove the user from the workspace', async () => {
      // Add a new user to the workspace
      const secondUser: UserDocument = {
        _id: Types.ObjectId(),
        fullName: 'Test User 2',
        email: 'test@test.com',
        password: '',
        isEnabled: true,
        isVerified: true,
        isAdmin: false,
      } as UserDocument;
      createdWorkspace.users.push(secondUser);
      await workspaceModel
        .updateOne({ _id: createdWorkspace._id }, createdWorkspace)
        .exec();

      const payload: UserDeletedEvent = new UserDeletedEvent(user._id);
      const serviceRemoveSpy = jest.spyOn(service, 'remove');
      serviceRemoveSpy.mockClear();
      await service.handleUserDeletedEvent(payload);
      expect(serviceRemoveSpy).toBeCalledTimes(0);
    });
  });
});
