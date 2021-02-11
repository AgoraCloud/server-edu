import { UserDocument } from '../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

export class WorkspaceResources {
  @Prop({ min: 1 })
  cpuCount?: number;

  @Prop({ min: 2 })
  memoryCount?: number;

  @Prop({ min: 8 })
  storageCount?: number;

  constructor(partial: Partial<WorkspaceResources>) {
    Object.assign(this, partial);
  }
}

export class WorkspaceProperties {
  @Prop()
  resources?: WorkspaceResources;

  constructor(partial: Partial<WorkspaceProperties>) {
    Object.assign(this, partial);
  }
}

@Schema({ collection: 'workspaces', timestamps: true })
export class Workspace {
  @Prop({ required: true, minlength: 4 })
  name: string;

  @Prop()
  properties?: WorkspaceProperties;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    index: true,
  })
  users: UserDocument[];

  constructor(partial: Partial<Workspace>) {
    Object.assign(this, partial);
  }
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
