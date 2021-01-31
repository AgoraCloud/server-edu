import { UserDocument } from '../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema({ collection: 'workspaces', timestamps: true })
export class Workspace {
  @Prop({ required: true, minlength: 4 })
  name: string;

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
