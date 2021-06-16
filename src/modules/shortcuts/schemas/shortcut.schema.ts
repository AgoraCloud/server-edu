import { UserDocument } from './../../users/schemas/user.schema';
import { User } from './../../../decorators/user.decorator';
import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ShortcutDocument = Shortcut & mongoose.Document;

@Schema({ collection: 'shortcuts', timestamps: true })
export class Shortcut {
  @Prop({ required: true, minlength: 4 })
  title: string;

  @Prop({ required: true })
  link: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace: WorkspaceDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  constructor(partial: Partial<Shortcut>) {
    Object.assign(this, partial);
  }
}

export const ShortcutSchema = SchemaFactory.createForClass(Shortcut);
