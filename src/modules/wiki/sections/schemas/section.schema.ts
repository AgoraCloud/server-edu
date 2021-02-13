import { UserDocument } from '../../../users/schemas/user.schema';
import { WorkspaceDocument } from '../../../workspaces/schemas/workspace.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type WikiSectionDocument = WikiSection & mongoose.Document;

@Schema({ collection: 'wiki_sections' })
export class WikiSection {
  @Prop({ required: true, minlength: 1 })
  name: string;

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

  constructor(partial: Partial<WikiSection>) {
    Object.assign(this, partial);
  }
}

export const WikiSectionSchema = SchemaFactory.createForClass(WikiSection);
