import { Token, TokenSchema } from './schemas/token.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
