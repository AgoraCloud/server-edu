import { UserCreatedEvent } from '../../events/user-created.event';
import { Event } from './../../events/events.enum';
import { addDays } from 'src/utils/date';
import { TokenType, TokenDocument } from '../tokens/schemas/token.schema';
import { TokensService } from './../tokens/tokens.service';
import { EnvironmentConfig } from './../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { AccountNotVerifiedException } from '../../exceptions/account-not-verified.exception';
import { AccountDisabledException } from '../../exceptions/account-disabled.exception';
import { User, UserDocument } from './schemas/user.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserNotFoundException } from 'src/exceptions/user-not-found.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly environment: EnvironmentConfig;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.environment = this.configService.get<EnvironmentConfig>('environment');
  }

  /**
   * Create a user
   * @param createUserDto the user to create
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user: User = new User({
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
    if (this.environment === EnvironmentConfig.Development) {
      user.isVerified = true;
    }
    const createdUser: UserDocument = await this.userModel.create(user);
    const verifyAccountToken: TokenDocument = await this.createVerifyAccountToken(
      createdUser,
    );
    this.eventEmitter.emit(
      Event.UserCreated,
      new UserCreatedEvent(createdUser, verifyAccountToken._id),
    );
    return createdUser;
  }

  /**
   * Update a user
   * @param email the users email
   * @param updateUserDto the updated user
   */
  async update(
    email: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user: UserDocument = await this.userModel.findOneAndUpdate(
      { email },
      updateUserDto,
      { new: true },
    );
    return user;
  }

  /**
   * Delete a user
   * @param email the users email
   */
  async remove(email: string): Promise<void> {
    await this.userModel.deleteOne({ email });
  }

  /**
   * Find a user by email
   * @param email the users email
   */
  async findByEmail(email: string): Promise<UserDocument> {
    const user: UserDocument = await this.userModel.findOne({ email });
    if (!user) throw new UserNotFoundException(email);
    if (!user.isEnabled) throw new AccountDisabledException(email);
    if (!user.isVerified) throw new AccountNotVerifiedException(email);
    return user;
  }

  /**
   * Find a user by email and refresh token
   * @param email the users email
   * @param refreshToken the users latest refresh token
   */
  async findByEmailAndRefreshToken(
    email: string,
    refreshToken: string,
  ): Promise<UserDocument> {
    const user: UserDocument = await this.findByEmail(email);
    const refreshTokensMatch: boolean = await bcrypt.compare(
      refreshToken,
      user.latestRefreshToken,
    );
    if (refreshTokensMatch) return user;
  }

  /**
   * Update a users latest refresh token
   * @param email the users email
   * @param latestRefreshToken the users latest refresh token
   */
  async updateRefreshToken(
    email: string,
    latestRefreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken: string = await bcrypt.hash(
      latestRefreshToken,
      10,
    );
    await this.userModel.updateOne(
      { email },
      { latestRefreshToken: hashedRefreshToken },
    );
  }

  /**
   * Clear a users refresh token
   * @param email the users email
   */
  async clearRefreshToken(email: string): Promise<void> {
    await this.userModel.updateOne({ email }, { latestRefreshToken: null });
  }

  /**
   * Update a users password
   * @param userId the users id
   * @param password the users new password
   */
  async updatePassword(userId: string, password: string): Promise<void> {
    const hashedPassword: string = await bcrypt.hash(password, 10);
    await this.userModel.updateOne(
      { _id: userId },
      { password: hashedPassword },
    );
  }

  /**
   * Verify a user
   * @param userId the users id
   */
  async verify(userId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { isVerified: true });
  }

  /**
   * Create an account verification token
   * @param user the users details
   */
  private createVerifyAccountToken(user: UserDocument): Promise<TokenDocument> {
    return this.tokensService.create({
      type: TokenType.VerifyAccount,
      user,
      expiresAt: addDays(new Date()),
    });
  }
}
