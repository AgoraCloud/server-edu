import { User, UserDocument } from '../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from '../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type AuditDocument = Audit & mongoose.Document;

@Schema({ collection: 'audit', timestamps: true })
export class Audit {
  @Prop({ required: true })
  isSuccessful: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace?: WorkspaceDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  constructor(partial: Partial<Audit>) {
    Object.assign(this, partial);
  }
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
