import { User } from '../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Workspace } from '../../workspaces/schemas/workspace.schema';

export enum DeploymentStatus {
  Pending = 'PENDING',
  Creating = 'CREATING',
  Running = 'RUNNING',
  Updating = 'UPDATING',
  Deleting = 'DELETING',
  Failed = 'FAILED',
  Unknown = 'UNKNOWN',
}

export class DeploymentResources {
  @Prop({ required: true, min: 1 })
  cpuCount: number;

  @Prop({ required: true, min: 2 })
  memoryCount: number;

  @Prop({ minLength: 8 })
  storageCount?: number;

  constructor(partial: Partial<DeploymentResources>) {
    Object.assign(this, partial);
  }
}

export class DeploymentImage {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  tag: string;

  constructor(partial: Partial<DeploymentImage>) {
    Object.assign(this, partial);
  }
}

export class DeploymentProperties {
  @Prop()
  namespace?: string;

  @Prop()
  serviceName?: string;

  @Prop()
  deploymentName?: string;

  @Prop()
  persistentVolumeClaimName?: string;

  @Prop({ required: true })
  image?: DeploymentImage;

  @Prop({ required: true })
  resources: DeploymentResources;

  constructor(partial: Partial<DeploymentProperties>) {
    Object.assign(this, partial);
  }
}

export type DeploymentDocument = Deployment & Document;

@Schema({ collection: 'deployments' })
export class Deployment {
  @Prop({ required: true, minlength: 4 })
  name: string;

  @Prop()
  url?: string;

  @Prop({
    required: true,
    enum: [
      DeploymentStatus.Pending,
      DeploymentStatus.Creating,
      DeploymentStatus.Running,
      DeploymentStatus.Updating,
      DeploymentStatus.Failed,
      DeploymentStatus.Unknown,
    ],
    default: DeploymentStatus.Pending,
  })
  status: string;

  @Prop({ required: true })
  properties: DeploymentProperties;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    index: true,
  })
  workspace: Workspace;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  user: User;

  constructor(partial: Partial<Deployment>) {
    Object.assign(this, partial);
  }
}

export const DeploymentSchema = SchemaFactory.createForClass(Deployment);
