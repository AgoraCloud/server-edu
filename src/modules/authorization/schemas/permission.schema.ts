import { User, UserDocument } from './../../users/schemas/user.schema';
import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import {
  RoleDto,
  ActionDto,
  InWorkspaceActionsDto,
  WorkspaceActionsDto,
} from '@agoracloud/common';
import * as mongoose from 'mongoose';

export class WorkspaceRolesAndPermissions {
  @Prop({
    required: true,
    type: [String],
    enum: [RoleDto.User, RoleDto.WorkspaceAdmin],
    default: [RoleDto.User],
  })
  roles: RoleDto[];

  @Prop({
    required: true,
    type: [String],
    enum: InWorkspaceActionsDto,
    default: InWorkspaceActionsDto,
  })
  permissions: ActionDto[];

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
    enum: [RoleDto.User, RoleDto.SuperAdmin],
    default: [RoleDto.User],
  })
  roles: RoleDto[];

  @Prop({
    required: true,
    type: [String],
    enum: WorkspaceActionsDto,
    default: WorkspaceActionsDto,
  })
  permissions: ActionDto[];

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
