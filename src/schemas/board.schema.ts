import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Workspace } from '../modules/workspaces/schemas/workspace.schema';

export type BoardDocument = Board & Document;

@Schema({ collection: 'boards' })
export class Board {
  @Prop({ required: true })
  name: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
    required: true,
  })
  workspace: Workspace;
}

export const BoardSchema = SchemaFactory.createForClass(Board);
