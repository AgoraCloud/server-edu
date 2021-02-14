import { ProjectLaneDocument } from './../../lanes/schemas/lane.schema';
import { ProjectDocument } from './../../schemas/project.schema';
import { UserDocument } from './../../../users/schemas/user.schema';
import { WorkspaceDocument } from './../../../workspaces/schemas/workspace.schema';
import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type ProjectTaskDocument = ProjectTask & mongoose.Document;

@Schema({ collection: 'project_tasks' })
export class ProjectTask {
  @Prop({ required: true, minlength: 1 })
  title: string;

  @Prop()
  description?: string;

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

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectLane',
    index: true,
  })
  lane: ProjectLaneDocument;

  constructor(partial: Partial<ProjectTask>) {
    Object.assign(this, partial);
  }
}

export const ProjectTaskSchema = SchemaFactory.createForClass(ProjectTask);
