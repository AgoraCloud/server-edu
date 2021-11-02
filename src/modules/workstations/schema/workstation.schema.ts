import { DeploymentDocument } from './../../deployments/schemas/deployment.schema';
import { User, UserDocument } from './../../users/schemas/user.schema';
import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Deployment } from '../../deployments/schemas/deployment.schema';

export type WorkstationDocument = Workstation & Document;

@Schema({ collection: 'workstations', timestamps: true })
export class Workstation {
  @Prop({ required: true, minlength: 1 })
  name: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    index: true,
  })
  user: UserDocument;

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
    ref: Deployment.name,
    index: true,
  })
  deployment: DeploymentDocument;

  constructor(partial: Partial<Workstation>) {
    Object.assign(this, partial);
  }
}

export const WorkstationSchema = SchemaFactory.createForClass(Workstation);
