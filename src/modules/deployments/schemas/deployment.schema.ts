import { DeploymentStatusDto, DeploymentTypeDto } from '@agoracloud/common';
import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

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
  @Prop({
    required: true,
    enum: [DeploymentTypeDto.VSCode],
  })
  type: DeploymentTypeDto;

  @Prop({ required: true })
  version: string;

  constructor(partial: Partial<DeploymentImage>) {
    Object.assign(this, partial);
  }
}

export class DeploymentProperties {
  @Prop({ default: false })
  isFavorite?: boolean;

  @Prop({ required: true, type: DeploymentImage })
  image: DeploymentImage;

  @Prop({ required: true, type: DeploymentResources })
  resources: DeploymentResources;

  constructor(partial: Partial<DeploymentProperties>) {
    Object.assign(this, partial);
  }
}

export type DeploymentDocument = Deployment & Document;

@Schema({ collection: 'deployments', timestamps: true })
export class Deployment {
  @Prop({ required: true, minlength: 4 })
  name: string;

  @Prop({
    required: true,
    enum: [
      DeploymentStatusDto.Pending,
      DeploymentStatusDto.Creating,
      DeploymentStatusDto.Running,
      DeploymentStatusDto.Updating,
      DeploymentStatusDto.Failed,
      DeploymentStatusDto.Unknown,
    ],
    default: DeploymentStatusDto.Pending,
  })
  status: DeploymentStatusDto;

  @Prop()
  failureReason?: string;

  @Prop({ required: true, type: DeploymentProperties })
  properties: DeploymentProperties;

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

  constructor(partial: Partial<Deployment>) {
    Object.assign(this, partial);
  }
}

export const DeploymentSchema = SchemaFactory.createForClass(Deployment);
