import {
  DeploymentStatusDto,
  DeploymentTypeDto,
  DeploymentVersionDto,
} from '@agoracloud/common';
import {
  Workspace,
  WorkspaceDocument,
} from './../../workspaces/schemas/workspace.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
    enum: [DeploymentTypeDto.VSCode, DeploymentTypeDto.Ubuntu],
  })
  type: DeploymentTypeDto;

  @Prop({
    required: true,
    enum: [
      DeploymentVersionDto.VSCode_3_10_2,
      DeploymentVersionDto.VSCode_3_9_3,
      DeploymentVersionDto.VSCode_3_9_2,
      DeploymentVersionDto.VSCode_3_9_1,
      DeploymentVersionDto.VSCode_3_9_0,
      DeploymentVersionDto.Ubuntu_37fd85aa,
    ],
  })
  version: DeploymentVersionDto;

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

  constructor(partial: Partial<Deployment>) {
    Object.assign(this, partial);
  }
}

export const DeploymentSchema = SchemaFactory.createForClass(Deployment);
