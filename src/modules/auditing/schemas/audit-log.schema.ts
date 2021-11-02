import {
  AuditResource,
  CustomAuditResourceDto,
} from './../dto/custom-audit-resource.dto';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from '../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AuditActionDto, AuditResourceDto } from '@agoracloud/common';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  isSuccessful: boolean;

  @Prop()
  failureReason?: string;

  @Prop({
    required: true,
    enum: [
      AuditActionDto.Create,
      AuditActionDto.Read,
      AuditActionDto.ReadImages,
      AuditActionDto.ReadLogs,
      AuditActionDto.ReadMetrics,
      AuditActionDto.Proxy,
      AuditActionDto.Update,
      AuditActionDto.Delete,
      AuditActionDto.LogIn,
      AuditActionDto.LogOut,
      AuditActionDto.ReadUsers,
      AuditActionDto.AddUser,
      AuditActionDto.RemoveUser,
      AuditActionDto.TurnOn,
      AuditActionDto.TurnOff,
    ],
  })
  action: AuditActionDto;

  @Prop({
    required: true,
    enum: [
      AuditResourceDto.User,
      AuditResourceDto.Permission,
      AuditResourceDto.AuditLog,
      AuditResourceDto.Workspace,
      AuditResourceDto.Deployment,
      AuditResourceDto.Project,
      AuditResourceDto.ProjectLane,
      AuditResourceDto.ProjectTask,
      AuditResourceDto.WikiSection,
      AuditResourceDto.WikiPage,
      AuditResourceDto.Shortcut,
      CustomAuditResourceDto.Workstation,
    ],
  })
  resource: AuditResource;

  @Prop({ required: true })
  userAgent: string;

  @Prop({ required: true })
  ip: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace?: WorkspaceDocument;

  constructor(partial: Partial<AuditLog>) {
    Object.assign(this, partial);
  }
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
