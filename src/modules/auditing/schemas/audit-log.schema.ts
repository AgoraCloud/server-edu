import {
  Action,
  AdminActions,
  InWorkspaceActions,
  WorkspaceActions,
} from './../../authorization/schemas/permission.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from '../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type AuditLogDocument = AuditLog & mongoose.Document;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  isSuccessful: boolean;

  @Prop({
    required: true,
    type: [String],
    enum: [...AdminActions, ...WorkspaceActions, ...InWorkspaceActions],
  })
  actions: Action[];

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
