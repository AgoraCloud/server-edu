import { UserNotInWorkspaceException } from './../../exceptions/user-not-in-workspace.exception';
import { UserDocument } from './../users/schemas/user.schema';
import {
  Permission,
  PermissionSchema,
  PermissionDocument,
  WorkspaceRolesAndPermissions,
} from './schemas/permission.schema';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { Connection, Types, Model } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from './authorization.service';
import { InternalServerErrorException } from '@nestjs/common';
import { WorkspaceNotFoundException } from './../../exceptions/workspace-not-found.exception';
import {
  ActionDto,
  RoleDto,
  UpdateUserPermissionsDto,
  UpdateWorkspaceUserPermissionsDto,
} from '@agoracloud/common';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
} as UserDocument;
const workspaceId: string = Types.ObjectId().toHexString();

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let connection: Connection;
  let permissionsModel: Model<PermissionDocument>;
  let permissions: PermissionDocument;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: Permission.name, schema: PermissionSchema },
        ]),
      ],
      providers: [AuthorizationService],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
    connection = await module.get(getConnectionToken());
    permissionsModel = module.get<Model<PermissionDocument>>(
      getModelToken(Permission.name),
    );

    // Create a permissions entry for the user
    const permission: Permission = new Permission({
      user,
      roles: [RoleDto.SuperAdmin],
      permissions: [],
      workspaces: new Map(),
    });
    permission.workspaces.set(workspaceId, {
      roles: [RoleDto.WorkspaceAdmin],
      permissions: [],
    });
    permissions = await permissionsModel.create(permission);
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw an error if the permissions for the given user were not found', async () => {
      const userId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new InternalServerErrorException()
        .message;
      try {
        await service.findOne(userId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the permissions for the given user', async () => {
      const permissions: PermissionDocument = await service.findOne(user._id);
      expect(permissions).toBeTruthy();
      expect(permissions.user._id).toEqual(user._id);
    });
  });

  describe('findOneWorkspacePermissions', () => {
    it('should throw an error if the permissions for the given user and workspace were not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new UserNotInWorkspaceException(
        user._id,
        workspaceId,
      ).message;
      try {
        await service.findOneWorkspacePermissions(user._id, workspaceId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the permissions for the given workspace and user', async () => {
      const workspaceRolesAndPermissions: WorkspaceRolesAndPermissions =
        await service.findOneWorkspacePermissions(user._id, workspaceId);
      expect(workspaceRolesAndPermissions).toBeTruthy();
      expect(workspaceRolesAndPermissions.roles.length).toBe(1);
      expect(workspaceRolesAndPermissions.roles[0]).toBe(
        permissions.workspaces.get(workspaceId).roles[0],
      );
      expect(workspaceRolesAndPermissions.permissions.length).toBe(0);
    });
  });

  describe('can', () => {
    it('should grant a super admin any permissions needed', async () => {
      const { canActivate, isAdmin } = await service.can(user, [
        ActionDto.CreateWorkspace,
        ActionDto.ReadWorkspace,
        ActionDto.ProxyDeployment,
        ActionDto.CreateDeployment,
      ]);
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(true);
    });

    it('should not grant a user application-wide permissions they do not have', async () => {
      // Demote the user to the 'user' role application-wide
      permissions = await permissionsModel
        .findOneAndUpdate(
          { _id: permissions._id },
          { roles: [RoleDto.User], permissions: [ActionDto.ReadWorkspace] },
          { new: true },
        )
        .exec();
      const { canActivate, isAdmin } = await service.can(user, [
        ActionDto.CreateWorkspace,
      ]);
      expect(canActivate).toBe(false);
      expect(isAdmin).toBe(false);
    });

    it('should grant a user application-wide permissions that they have', async () => {
      const { canActivate, isAdmin } = await service.can(user, [
        ActionDto.ReadWorkspace,
      ]);
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(false);
    });

    it('should throw an error if the permissions for the given workspace id and user were not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WorkspaceNotFoundException(
        workspaceId,
      ).message;
      try {
        await service.can(
          user,
          [ActionDto.ReadWorkspace, ActionDto.ReadDeployment],
          workspaceId,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should grant a workspace admin any workspace-wide permissions needed', async () => {
      const { canActivate, isAdmin } = await service.can(
        user,
        [
          ActionDto.ReadWorkspace,
          ActionDto.ProxyDeployment,
          ActionDto.CreateProject,
          ActionDto.DeleteWikiSection,
        ],
        workspaceId,
      );
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(true);
    });

    it('should not grant a workspace user any workspace-wide permissions they do not have', async () => {
      // Demote the user to the 'user' role workspace-wide
      permissions.workspaces.set(workspaceId, {
        roles: [RoleDto.User],
        permissions: [
          ActionDto.CreateDeployment,
          ActionDto.ReadDeployment,
          ActionDto.ProxyDeployment,
          ActionDto.CreateWiki,
          ActionDto.ReadWiki,
          ActionDto.UpdateWiki,
          ActionDto.DeleteWiki,
        ],
      });
      permissions = await permissionsModel
        .findOneAndUpdate({ _id: permissions._id }, permissions, { new: true })
        .exec();

      const { canActivate, isAdmin } = await service.can(
        user,
        [ActionDto.ReadWorkspace, ActionDto.DeleteDeployment],
        workspaceId,
      );
      expect(canActivate).toBe(false);
      expect(isAdmin).toBe(false);
    });

    it('should grant a workspace user any workspace-wide permissions they have', async () => {
      const { canActivate, isAdmin } = await service.can(
        user,
        [ActionDto.ReadWorkspace, ActionDto.CreateDeployment],
        workspaceId,
      );
      expect(canActivate).toBe(true);
      expect(isAdmin).toBe(false);
    });
  });

  describe('updateUserPermissions', () => {
    it('should update the users application-wide roles and clear the users permissions if the users new role is super admin', async () => {
      const updateUserPermissionsDto: UpdateUserPermissionsDto = {
        roles: [RoleDto.SuperAdmin],
        permissions: [ActionDto.DeleteWorkspace],
      };
      const updatedPermissions: PermissionDocument =
        await service.updateUserPermissions(user._id, updateUserPermissionsDto);
      expect(updatedPermissions.roles.length).toBe(1);
      expect(updatedPermissions.roles[0]).toBe(
        updateUserPermissionsDto.roles[0],
      );
      expect(updatedPermissions.permissions.length).toBe(0);
    });

    it('should update the users application-wide roles and permissions', async () => {
      const updateUserPermissionsDto: UpdateUserPermissionsDto = {
        roles: [RoleDto.User],
        permissions: [ActionDto.CreateWorkspace, ActionDto.DeleteWorkspace],
      };
      const updatedPermissions: PermissionDocument =
        await service.updateUserPermissions(user._id, updateUserPermissionsDto);
      expect(updatedPermissions.roles.length).toBe(1);
      expect(updatedPermissions.roles[0]).toBe(
        updateUserPermissionsDto.roles[0],
      );
      expect(updatedPermissions.permissions.length).toBe(2);
    });
  });

  describe('updateUsersWorkspacePermissions', () => {
    it('should throw an error if the permissions for the given user and workspace were not found', async () => {
      const workspaceId: string = Types.ObjectId().toHexString();
      const updateWorkspaceUserPermissionsDto: UpdateWorkspaceUserPermissionsDto =
        {
          roles: [RoleDto.User],
          permissions: [],
        };
      const expectedErrorMessage: string = new UserNotInWorkspaceException(
        user._id,
        workspaceId,
      ).message;
      try {
        await service.updateUsersWorkspacePermissions(
          user._id,
          workspaceId,
          updateWorkspaceUserPermissionsDto,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the users workspace-wide roles and permissions', async () => {
      const updateWorkspaceUserPermissionsDto: UpdateWorkspaceUserPermissionsDto =
        {
          roles: [RoleDto.WorkspaceAdmin],
          permissions: [ActionDto.CreateWikiSection],
        };
      const updatedPermissions: WorkspaceRolesAndPermissions =
        await service.updateUsersWorkspacePermissions(
          user._id,
          workspaceId,
          updateWorkspaceUserPermissionsDto,
        );
      expect(updatedPermissions.roles.length).toBe(1);
      expect(updatedPermissions.roles[0]).toBe(
        updateWorkspaceUserPermissionsDto.roles[0],
      );
      expect(updatedPermissions.permissions.length).toBe(0);
    });
  });
});
