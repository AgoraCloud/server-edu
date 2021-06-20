import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { User, UserDocument } from './../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ collection: 'projects', timestamps: true })
export class Project {
  @Prop({ required: true, minlength: 4 })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: Workspace.name,
    index: true,
  })
  workspace: WorkspaceDocument;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

  constructor(partial: Partial<Project>) {
    Object.assign(this, partial);
  }
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
