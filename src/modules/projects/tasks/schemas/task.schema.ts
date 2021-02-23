import {
  ProjectLane,
  ProjectLaneDocument,
} from './../../lanes/schemas/lane.schema';
import { Project, ProjectDocument } from './../../schemas/project.schema';
import { User, UserDocument } from './../../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from './../../../workspaces/schemas/workspace.schema';
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

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: Project.name,
    index: true,
  })
  project: ProjectDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: ProjectLane.name,
    index: true,
  })
  lane: ProjectLaneDocument;

  constructor(partial: Partial<ProjectTask>) {
    Object.assign(this, partial);
  }
}

export const ProjectTaskSchema = SchemaFactory.createForClass(ProjectTask);
