import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Workspace } from '../modules/workspaces/schemas/workspace.schema';

export type WikiPageDocument = WikiPage & Document;

@Schema({ collection: 'wiki_pages' })
export class WikiPage {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
    required: true,
  })
  workspace: Workspace;
}

export const WikiPageSchema = SchemaFactory.createForClass(WikiPage);
