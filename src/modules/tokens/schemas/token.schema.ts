import { User, UserDocument } from '../../users/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum TokenType {
  ChangePassword = 'CHANGE_PASSWORD',
  VerifyAccount = 'VERIFY_ACCOUNT',
}

export type TokenDocument = Token & Document;

@Schema({ collection: 'tokens' })
export class Token {
  @Prop({
    required: true,
    enum: [TokenType.ChangePassword, TokenType.VerifyAccount],
    index: true,
  })
  type: TokenType;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
  })
  user: UserDocument;

  constructor(partial: Partial<Token>) {
    Object.assign(this, partial);
  }
}

export const TokenSchema = SchemaFactory.createForClass(Token);
