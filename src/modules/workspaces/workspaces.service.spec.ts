import { MinOneUserInWorkspaceException } from './../../exceptions/min-one-user-in-workspace.exception';
import { TokensService } from './../tokens/tokens.service';
import { ConfigService } from '@nestjs/config';
import { Token, TokenSchema } from './../tokens/schemas/token.schema';
import { User, UserSchema } from './../users/schemas/user.schema';
import { UsersService } from './../users/users.service';
import { ExistingWorkspaceUserException } from './../../exceptions/existing-workspace-user.exception';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceNotFoundException } from './../../exceptions/workspace-not-found.exception';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UserDocument } from '../users/schemas/user.schema';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from '../../../test/utils/mongoose-mock-module';
import {
  Workspace,
  WorkspaceDocument,
  WorkspaceSchema,
} from './schemas/workspace.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { Connection, Types } from 'mongoose';
import { JwtConfig } from '../../config/configuration.interface';

const jwtConfig: JwtConfig = {
  access: {
    secret: 'secret',
  },
  refresh: {
    secret: 'refresh_secret',
  },
};

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
} as UserDocument;

let workspace: WorkspaceDocument;

let workspaceUser2Id: string;

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let usersService: UsersService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: Workspace.name, schema: WorkspaceSchema },
        ]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
      ],
      providers: [
        WorkspacesService,
        UsersService,
        {
          provide: ConfigService,
          useValue: {
            get(key: string) {
              switch (key) {
                case 'jwt': {
                  return jwtConfig;
                }
              }
            },
          },
        },
        TokensService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    usersService = module.get<UsersService>(UsersService);
    connection = await module.get(getConnectionToken());
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
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
      workspace = createdWorkspace;
    });
  });

  describe('findAll', () => {
    it('should find all the users workspaces', async () => {
      const retrievedWorkspaces: WorkspaceDocument[] = await service.findAll(
        user._id,
      );
      expect(retrievedWorkspaces).toHaveLength(1);
      expect(retrievedWorkspaces[0].users[0]._id).toEqual(user._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the workspace with the given id was not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.findOne(workspaceId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the users workspace with the given id', async () => {
      const retrievedWorkspace: WorkspaceDocument = await service.findOne(
        workspace._id,
        user._id,
      );
      expect(retrievedWorkspace._id).toEqual(workspace._id);
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
        await service.update(workspaceId, updateWorkspaceDto, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the users workspace', async () => {
      const updateWorkspaceDto: UpdateWorkspaceDto = {
        name: 'New Test Workspace',
        properties: {
          resources: {
            cpuCount: 5,
            memoryCount: 8,
            storageCount: 16,
          },
        },
      };
      const updatedWorkspace: WorkspaceDocument = await service.update(
        workspace._id,
        updateWorkspaceDto,
        user._id,
      );
      expect(updatedWorkspace._id).toEqual(workspace._id);
      expect(updatedWorkspace.users[0]._id).toEqual(user._id);
      expect(updatedWorkspace.name).toBe(updateWorkspaceDto.name);
      expect(updatedWorkspace.properties.resources.cpuCount).toBe(
        updateWorkspaceDto.properties.resources.cpuCount,
      );
      expect(updatedWorkspace.properties.resources.memoryCount).toBe(
        updateWorkspaceDto.properties.resources.memoryCount,
      );
      expect(updatedWorkspace.properties.resources.storageCount).toBe(
        updateWorkspaceDto.properties.resources.storageCount,
      );
    });
  });

  describe('addUser', () => {
    it('should throw an error if the user is already a member of the workspace', async () => {
      const expectedErrorMessage: string = new ExistingWorkspaceUserException(
        workspace._id,
        user._id,
      ).message;
      try {
        await service.addUser(workspace, { id: user._id });
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should add the user to the workspace', async () => {
      // Create a new user
      const newUser: UserDocument = await usersService.create({
        fullName: 'Test User 2',
        email: 'test2@test.com',
        password: 'Password123',
      });
      workspaceUser2Id = newUser._id;
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      const updatedWorkspace: WorkspaceDocument = await service.addUser(
        workspace,
        { id: workspaceUser2Id },
      );
      expect(updatedWorkspace.users.length).toBe(2);
      expect(updatedWorkspace.users[1]._id).toEqual(workspaceUser2Id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeUser', () => {
    it('should remove the user from the workspace', async () => {
      const updatedWorkspace: WorkspaceDocument = await service.removeUser(
        workspace,
        workspaceUser2Id,
      );
      expect(updatedWorkspace.users.length).toBe(1);
    });

    it('should throw an error if the workspace will have no members left if the user was removed', async () => {
      const expectedErrorMessage: string = new MinOneUserInWorkspaceException(
        workspace._id,
      ).message;
      try {
        await service.removeUser(workspace, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });
  });

  describe('remove', () => {
    it('should throw an error if the workspace with the given id was not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.remove(workspaceId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the users workspace', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      eventEmitterSpy.mockClear();
      await service.remove(workspace._id, user._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
