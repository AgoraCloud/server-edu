import { UserDocument } from '../../../users/schemas/user.schema';
import { WorkspaceDocument } from '../../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type WikiPageDocument = WikiPage & Document;

@Schema({ collection: 'wiki_pages' })
export class WikiPage {
  @Prop({ required: true, minlength: 1 })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    index: true,
  })
  workspace: WorkspaceDocument;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  })
  user: UserDocument;
}

export const WikiPageSchema = SchemaFactory.createForClass(WikiPage);
