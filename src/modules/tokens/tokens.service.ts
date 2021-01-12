import { TokenNotFoundException } from './../../exceptions/token-not-found.exception';
import { TokenType, Token, TokenDocument } from './schemas/token.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TokensService {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
  ) {}

  /**
   * Create a token
   * @param token the token to create
   */
  create(token: Token): Promise<TokenDocument> {
    const createdToken: TokenDocument = new this.tokenModel(token);
    return createdToken.save();
  }

  /**
   * Find and remove a token with the given id and type
   * @param tokenId the token id
   * @param type the token type
   */
  async findOneAndRemove(
    tokenId: string,
    type: TokenType,
  ): Promise<TokenDocument> {
    const token: TokenDocument = await this.tokenModel
      .findOneAndDelete({
        _id: tokenId,
        type,
      })
      .populate('user');
    if (!token) throw new TokenNotFoundException(tokenId);
    return token;
  }

  /**
   * Checks if a token is expired
   * @param token the token to check
   */
  isTokenExpired(token: TokenDocument): boolean {
    return token.expiresAt < new Date();
  }
}
