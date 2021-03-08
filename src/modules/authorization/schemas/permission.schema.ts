import { User, UserDocument } from './../../users/schemas/user.schema';
import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export enum Role {
  User = 'user',
  SuperAdmin = 'super_admin',
  WorkspaceAdmin = 'workspace_admin',
}

export enum Action {
  // User Actions
  ManageUser = 'users:manage',
  // Workspace Actions
  ManageWorkspace = 'workspaces:manage',
  CreateWorkspace = 'workspaces:create',
  ReadWorkspace = 'workspaces:read',
  UpdateWorkspace = 'workspaces:update',
  DeleteWorkspace = 'workspaces:delete',
  // Deployment Actions
  CreateDeployment = 'deployments:create',
  ReadDeployment = 'deployments:read',
  ProxyDeployment = 'deployments:proxy',
  UpdateDeployment = 'deployments:update',
  DeleteDeployment = 'deployments:delete',
  // Wiki Actions
  CreateWiki = 'wiki:create',
  ReadWiki = 'wiki:read',
  UpdateWiki = 'wiki:update',
  DeleteWiki = 'wiki:delete',
  // Wiki Section Actions
  CreateWikiSection = 'wiki_sections:create',
  ReadWikiSection = 'wiki_sections:read',
  UpdateWikiSection = 'wiki_sections:update',
  DeleteWikiSection = 'wiki_sections:delete',
  // Wiki Page Actions
  CreateWikiPage = 'wiki_pages:create',
  ReadWikiPage = 'wiki_pages:read',
  UpdateWikiPage = 'wiki_pages:update',
  DeleteWikiPage = 'wiki_pages:delete',
  // Project Actions
  CreateProject = 'projects:create',
  ReadProject = 'projects:read',
  UpdateProject = 'projects:update',
  DeleteProject = 'projects:delete',
  // Project Lane Actions
  CreateProjectLane = 'project_lanes:create',
  ReadProjectLane = 'project_lanes:read',
  UpdateProjectLane = 'project_lanes:update',
  DeleteProjectLane = 'project_lanes:delete',
  // Project Task Actions
  CreateProjectTask = 'project_tasks:create',
  ReadProjectTask = 'project_tasks:read',
  UpdateProjectTask = 'project_tasks:update',
  DeleteProjectTask = 'project_tasks:delete',
}

export const WorkspaceActions: Action[] = [
  Action.CreateWorkspace,
  Action.ReadWorkspace,
  Action.UpdateWorkspace,
  Action.DeleteWorkspace,
];

export const InWorkspaceActions: Action[] = [
  Action.CreateDeployment,
  Action.ReadDeployment,
  Action.ProxyDeployment,
  Action.UpdateDeployment,
  Action.DeleteDeployment,
  Action.CreateWiki,
  Action.ReadWiki,
  Action.UpdateWiki,
  Action.DeleteWiki,
  Action.CreateWikiSection,
  Action.ReadWikiSection,
  Action.UpdateWikiSection,
  Action.DeleteWikiSection,
  Action.CreateWikiPage,
  Action.ReadWikiPage,
  Action.UpdateWikiPage,
  Action.DeleteWikiPage,
  Action.CreateProject,
  Action.ReadProject,
  Action.UpdateProject,
  Action.DeleteProject,
  Action.CreateProjectLane,
  Action.ReadProjectLane,
  Action.UpdateProjectLane,
  Action.DeleteProjectLane,
  Action.CreateProjectTask,
  Action.ReadProjectTask,
  Action.UpdateProjectTask,
  Action.DeleteProjectTask,
];

export class WorkspaceRolesAndPermissions {
  @Prop({
    required: true,
    type: [String],
    enum: [Role.User, Role.WorkspaceAdmin],
    default: [Role.User],
  })
  roles: Role[];

  @Prop({
    required: true,
    type: [String],
    enum: InWorkspaceActions,
    default: InWorkspaceActions,
  })
  permissions: Action[];

  constructor(partial: Partial<WorkspaceRolesAndPermissions>) {
    Object.assign(this, partial);
  }
}

export type PermissionDocument = Permission & mongoose.Document;

@Schema({ collection: 'permissions' })
export class Permission {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
    unique: true,
  })
  user: UserDocument;

  @Prop({
    required: true,
    type: [String],
    enum: [Role.User, Role.SuperAdmin],
    default: [Role.User],
  })
  roles: Role[];

  @Prop({
    required: true,
    type: [String],
    enum: WorkspaceActions,
    default: WorkspaceActions,
  })
  permissions: Action[];

  @Prop({
    required: true,
    type: Map,
    default: new Map<string, WorkspaceRolesAndPermissions>(),
  })
  workspaces: Map<string, WorkspaceRolesAndPermissions>;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
