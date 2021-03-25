import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from '../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export enum AuditAction {
  Create = 'CREATE',
  Read = 'READ',
  ReadImages = 'READ_IMAGES',
  ReadLogs = 'READ_LOGS',
  ReadMetrics = 'READ_METRICS',
  Proxy = 'PROXY',
  Update = 'UPDATE',
  Delete = 'DELETE',
  LogIn = 'LOG_IN',
  LogOut = 'LOG_OUT',
  ReadUsers = 'READ_USERS',
  AddUser = 'ADD_USER',
  RemoveUser = 'REMOVE_USER',
}

export enum AuditResource {
  User = 'USER',
  Permission = 'PERMISSION',
  AuditLog = 'AUDIT_LOG',
  Workspace = 'WORKSPACE',
  Deployment = 'DEPLOYMENT',
  Project = 'PROJECT',
  ProjectLane = 'PROJECT_LANE',
  ProjectTask = 'PROJECT_TASK',
  WikiSection = 'WIKI_SECTION',
  WikiPage = 'WIKI_PAGE',
}

export type AuditLogDocument = AuditLog & mongoose.Document;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  isSuccessful: boolean;

  @Prop({
    required: true,
    enum: [
      AuditAction.Create,
      AuditAction.Read,
      AuditAction.ReadImages,
      AuditAction.ReadLogs,
      AuditAction.ReadMetrics,
      AuditAction.Proxy,
      AuditAction.Update,
      AuditAction.Delete,
      AuditAction.LogIn,
      AuditAction.LogOut,
      AuditAction.ReadUsers,
      AuditAction.AddUser,
      AuditAction.RemoveUser,
    ],
  })
  action: AuditAction;

  @Prop({
    required: true,
    enum: [
      AuditResource.User,
      AuditResource.Permission,
      AuditResource.AuditLog,
      AuditResource.Workspace,
      AuditResource.Deployment,
      AuditResource.Project,
      AuditResource.ProjectLane,
      AuditResource.ProjectTask,
      AuditResource.WikiSection,
      AuditResource.WikiPage,
    ],
  })
  resource: AuditResource;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  ip: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace?: WorkspaceDocument;

  constructor(partial: Partial<AuditLog>) {
    Object.assign(this, partial);
  }
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
