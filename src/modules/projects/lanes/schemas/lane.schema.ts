import { ProjectDocument } from './../../schemas/project.schema';
import { UserDocument } from './../../../users/schemas/user.schema';
import { WorkspaceDocument } from './../../../workspaces/schemas/workspace.schema';
import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ProjectLaneDocument = ProjectLane & mongoose.Document;

@Schema({ collection: 'project_lanes' })
export class ProjectLane {
  @Prop({ required: true, minlength: 1 })
  name: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    index: true,
  })
  workspace: WorkspaceDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  user: UserDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true,
  })
  project: ProjectDocument;

  constructor(partial: Partial<ProjectLane>) {
    Object.assign(this, partial);
  }
}

export const ProjectLaneSchema = SchemaFactory.createForClass(ProjectLane);
