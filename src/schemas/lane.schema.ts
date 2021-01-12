import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Board } from './board.schema';

export type LaneDocument = Lane & Document;

@Schema({ collection: 'lanes' })
export class Lane {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Board' }],
    required: true,
  })
  board: Board;
}

export const LaneSchema = SchemaFactory.createForClass(Lane);
