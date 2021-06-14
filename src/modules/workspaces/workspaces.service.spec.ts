import { MinOneUserInWorkspaceException } from './../../exceptions/min-one-user-in-workspace.exception';
import { TokensService } from './../tokens/tokens.service';
import { ConfigService } from '@nestjs/config';
import { Token, TokenSchema } from './../tokens/schemas/token.schema';
import { User, UserSchema } from './../users/schemas/user.schema';
import { UsersService } from './../users/users.service';
import { ExistingWorkspaceUserException } from './../../exceptions/existing-workspace-user.exception';
import { WorkspaceNotFoundException } from './../../exceptions/workspace-not-found.exception';
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
import {
  getConnectionToken,
  getModelToken,
  MongooseModule,
} from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { Connection, Model, Types } from 'mongoose';
import { JwtConfig } from '../../config/configuration.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import {
  Permission,
  PermissionDocument,
  PermissionSchema,
  WorkspaceRolesAndPermissions,
} from '../authorization/schemas/permission.schema';
import { MinOneAdminUserInWorkspaceException } from './../../exceptions/min-one-admin-user-in-workspace.exception';
import {
  CreateWorkspaceDto,
  RoleDto,
  UpdateWorkspaceDto,
} from '@agoracloud/common';

const jwtConfig: JwtConfig = {
  access: {
    secret: 'secret',
  },
  refresh: {
    secret: 'refresh_secret',
  },
};

let user: UserDocument;
let user2: UserDocument;
let workspace: WorkspaceDocument;

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let usersService: UsersService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;
  let permissionsModel: Model<PermissionDocument>;

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
        MongooseModule.forFeature([
          { name: Permission.name, schema: PermissionSchema },
        ]),
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
        AuthorizationService,
        TokensService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    usersService = module.get<UsersService>(UsersService);
    connection = await module.get(getConnectionToken());
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    permissionsModel = module.get<Model<PermissionDocument>>(
      getModelToken(Permission.name),
    );

    // Create a user
    user = await usersService.create({
      fullName: 'Test User',
      email: 'test@test.com',
      password: 'Password123',
    });

    // Create another test user
    user2 = await usersService.create({
      fullName: 'Test User 2',
      email: 'test2@test.com',
      password: 'Password123',
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

  describe('findOneUsers', () => {
    it('should throw an error if the workspace with the given id was not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.findOneUsers(workspaceId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the users in the workspace with the given id', async () => {
      const retrievedWorkspace: WorkspaceDocument = await service.findOneUsers(
        workspace._id,
      );
      expect(retrievedWorkspace._id).toEqual(workspace._id);
      expect(retrievedWorkspace.users.length).toBe(1);
      const workspaceUser: UserDocument = retrievedWorkspace.users[0];
      expect(workspaceUser).toBeTruthy();
      // The information of the user in the workspace should be populated
      expect(workspaceUser._id).toEqual(user._id);
      expect(workspaceUser.fullName).toBe(user.fullName);
      expect(workspaceUser.email).toBe(user.email);
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
        user.email,
      ).message;
      try {
        await service.addUser(workspace, { email: user.email });
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the workspace with the given id was not found', async () => {
      const tempWorkspace: WorkspaceDocument = Object.assign({}, workspace);
      tempWorkspace._id = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        tempWorkspace._id,
      ).message;
      try {
        await service.addUser(tempWorkspace, { email: user.email });
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should not throw an error if the user was not found', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      const updatedWorkspace: WorkspaceDocument = await service.addUser(
        workspace,
        { email: 'random@test.com' },
      );
      expect(updatedWorkspace.users.length).toBe(1);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(0);
    });

    it('should add the user to the workspace', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      const updatedWorkspace: WorkspaceDocument = await service.addUser(
        workspace,
        { email: user2.email },
      );
      expect(updatedWorkspace.users.length).toBe(2);
      expect(updatedWorkspace.users[1]._id).toEqual(user2._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
      workspace = updatedWorkspace;
    });
  });

  describe('removeUser', () => {
    beforeAll(async () => {
      // Create permissions for user
      const userPermission: Permission = new Permission({
        user,
        roles: [RoleDto.User],
      });
      userPermission.workspaces = new Map<
        string,
        WorkspaceRolesAndPermissions
      >();
      userPermission.workspaces.set(workspace._id, {
        roles: [RoleDto.WorkspaceAdmin],
        permissions: [],
      });
      await permissionsModel.create(userPermission);

      // Create permissions for user2
      const user2Permission = new Permission({
        user: user2,
        roles: [RoleDto.User],
      });
      user2Permission.workspaces = new Map<
        string,
        WorkspaceRolesAndPermissions
      >();
      user2Permission.workspaces.set(workspace._id, {
        roles: [RoleDto.User],
        permissions: [],
      });
      await permissionsModel.create(user2Permission);
    });

    it('should remove the user from the workspace', async () => {
      const updatedWorkspace: WorkspaceDocument = await service.removeUser(
        workspace,
        user2._id,
      );
      expect(updatedWorkspace.users.length).toBe(1);
      workspace = updatedWorkspace;
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

    it('should throw an error if the workspace will have no admin members left if the user was removed', async () => {
      // Re-add user2 temporarily
      workspace = await service.addUser(workspace, { email: user2.email });

      const expectedErrorMessage: string =
        new MinOneAdminUserInWorkspaceException(workspace._id).message;
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
