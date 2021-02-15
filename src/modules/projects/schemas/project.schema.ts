import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { User, UserDocument } from './../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ProjectDocument = Project & mongoose.Document;

@Schema({ collection: 'projects' })
export class Project {
  @Prop({ required: true, minlength: 4 })
  name: string;

  @Prop()
  description?: string;

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

  constructor(partial: Partial<Project>) {
    Object.assign(this, partial);
  }
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
