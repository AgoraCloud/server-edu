import { DateUtil } from './../../utils/date.util';
import { TokenExpiredException } from './../../exceptions/token-expired.exception';
import { UserDeletedEvent } from './../../events/user-deleted.event';
import { OnEvent } from '@nestjs/event-emitter';
import { TokenNotFoundException } from './../../exceptions/token-not-found.exception';
import { TokenType, Token, TokenDocument } from './schemas/token.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from '../../events/events.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokensService {
  constructor(
    @InjectModel(Token.name) private readonly tokenModel: Model<TokenDocument>,
  ) {}

  /**
   * Create a token
   * @param token the token to create
   * @returns the created token document
   */
  create(token: Token): Promise<TokenDocument> {
    const createdToken: TokenDocument = new this.tokenModel(token);
    return createdToken.save();
  }

  /**
   * Find and remove a token with the given id and type
   * @param tokenId the token id
   * @param type the token type
   * @throws TokenNotFoundException
   * @returns the deleted token document
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
      .populate('user')
      .exec();
    if (!token) throw new TokenNotFoundException(tokenId);
    return token;
  }

  /**
   * Remove all tokens for the given user
   * @param userId the users id
   */
  private async removeAll(userId: string): Promise<void> {
    await this.tokenModel.deleteMany().where('user').equals(userId).exec();
  }

  /**
   * Checks if a token is expired
   * @param token the token to check
   * @throws TokenExpiredException
   */
  isTokenExpired(token: TokenDocument): void {
    if (token.expiresAt < new Date()) {
      throw new TokenExpiredException(token._id);
    }
  }

  /**
   * Handles the user.deleted event
   * @param payload the user.deleted event payload
   */
  @OnEvent(Event.UserDeleted)
  private async handleUserDeletedEvent(
    payload: UserDeletedEvent,
  ): Promise<void> {
    await this.removeAll(payload.id);
  }

  /**
   * Cron job that runs every hour and deletes expired
   * tokens (tokens expire after 24 hours)
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteExpiredTokensJob(): Promise<void> {
    const yesterday: Date = DateUtil.removeDays(new Date());
    await this.tokenModel
      .deleteMany()
      .where('expiresAt')
      .lte(yesterday.getTime())
      .exec();
  }
}
