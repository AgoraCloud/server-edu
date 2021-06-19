import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InDatabaseConfigDocument = InDatabaseConfig & Document;

@Schema({
  collection: 'config',
  timestamps: true,
  capped: { size: 100000, max: 1 },
})
export class InDatabaseConfig {
  @Prop({ required: true, default: Types.ObjectId().toHexString() })
  instanceId: string;

  constructor(partial: Partial<InDatabaseConfig>) {
    Object.assign(this, partial);
  }
}

export const InDatabaseConfigSchema =
  SchemaFactory.createForClass(InDatabaseConfig);
