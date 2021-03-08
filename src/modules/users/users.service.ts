import { UserWithIdNotFoundException } from './../../exceptions/user-not-found.exception';
import { UserDeletedEvent } from './../../events/user-deleted.event';
import { UserCreatedEvent } from '../../events/user-created.event';
import { Event } from './../../events/events.enum';
import { addDays, removeDays } from '../../utils/date';
import { TokenType, TokenDocument } from '../tokens/schemas/token.schema';
import { TokensService } from './../tokens/tokens.service';
import {
  AdminConfig,
  EnvironmentConfig,
} from './../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { AccountNotVerifiedException } from '../../exceptions/account-not-verified.exception';
import { AccountDisabledException } from '../../exceptions/account-disabled.exception';
import { User, UserDocument } from './schemas/user.schema';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Role } from '../authorization/schemas/permission.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly environment: EnvironmentConfig;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.environment = this.configService.get<EnvironmentConfig>('environment');
  }

  async onModuleInit(): Promise<void> {
    await this.createAdminUser();
  }

  /**
   * Checks if the admin user has been created. If not,
   * the admin user is created.
   */
  private async createAdminUser(): Promise<void> {
    const adminConfig: AdminConfig = this.configService.get<AdminConfig>(
      'admin',
    );
    try {
      await this.findByEmail(adminConfig.email);
    } catch (err) {
      // Admin user has not been created yet, create it
      const createdUser: UserDocument = await this.userModel.create({
        email: adminConfig.email,
        fullName: 'Admin',
        password: await bcrypt.hash(adminConfig.password, 10),
        isVerified: true,
      });
      // Add an artificial delay, the event emitter does not emit any events on initialization
      setTimeout(
        () =>
          this.eventEmitter.emit(
            Event.UserCreated,
            new UserCreatedEvent(createdUser, undefined, Role.SuperAdmin),
          ),
        2000,
      );
    }
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
   * Find a user by email
   * @param email the users email
   */
  async findByEmail(email: string): Promise<UserDocument> {
    const user: UserDocument = await this.userModel.findOne({ email }).exec();
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
    if (!user.latestRefreshToken) return;
    const refreshTokensMatch: boolean = await bcrypt.compare(
      refreshToken,
      user.latestRefreshToken,
    );
    if (refreshTokensMatch) return user;
  }

  /**
   * Checks whether a user exists or not
   * @param userId the users id
   */
  async doesExist(userId: string): Promise<void> {
    const exists: boolean = await this.userModel.exists({ _id: userId });
    if (!exists) throw new UserWithIdNotFoundException(userId);
  }

  /**
   * Update a user
   * @param userId the users id
   * @param updateUserDto the updated user
   */
  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user: UserDocument = await this.userModel
      .findOneAndUpdate({ _id: userId }, updateUserDto, { new: true })
      .exec();
    return user;
  }

  /**
   * Delete a user
   * @param userId the users id
   */
  async remove(userId: string): Promise<void> {
    await this.userModel.deleteOne({ _id: userId }).exec();
    this.eventEmitter.emit(Event.UserDeleted, new UserDeletedEvent(userId));
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
    await this.userModel
      .updateOne({ email }, { latestRefreshToken: hashedRefreshToken })
      .exec();
  }

  /**
   * Clear a users refresh token
   * @param email the users email
   */
  async clearRefreshToken(email: string): Promise<void> {
    await this.userModel
      .updateOne({ email }, { latestRefreshToken: null })
      .exec();
  }

  /**
   * Update a users password
   * @param userId the users id
   * @param password the users new password
   */
  async updatePassword(userId: string, password: string): Promise<void> {
    const hashedPassword: string = await bcrypt.hash(password, 10);
    await this.userModel
      .updateOne({ _id: userId }, { password: hashedPassword })
      .exec();
  }

  /**
   * Verify a user
   * @param userId the users id
   */
  async verify(userId: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { isVerified: true })
      .exec();
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

  /**
   * Cron job that runs every hour and deletes stale
   * users (users that have not verified their accounts
   * in 24 hours)
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteStaleUsersJob(): Promise<void> {
    const yesterday: Date = removeDays(new Date());
    const staleUsers: UserDocument[] = await this.userModel
      .find()
      .where('isVerified')
      .equals(false)
      .where('createdAt')
      .lte(yesterday.getTime())
      .exec();
    for (const staleUser of staleUsers) {
      await this.remove(staleUser._id);
    }
  }
}
