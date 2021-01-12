import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Lane } from './lane.schema';

export enum TaskStatus {
  Todo = 'TODO',
  InProgress = 'IN_PROGRESS',
  Done = 'DONE',
}

export type TaskDocument = Task & Document;

@Schema({ collection: 'tasks' })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: true,
    enum: [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done],
    default: TaskStatus.Todo,
  })
  status: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lane' }],
    required: true,
  })
  lane: Lane;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
