import { Config } from '../../config/configuration.interface';
import {
  UserWithIdNotFoundException,
  UserNotFoundException,
} from './../../exceptions/user-not-found.exception';
import { UserDeletedEvent } from './../../events/user-deleted.event';
import { UserCreatedEvent } from '../../events/user-created.event';
import { Event } from './../../events/events.enum';
import { addDays, removeDays } from '../../utils/date';
import { TokenType, TokenDocument } from '../tokens/schemas/token.schema';
import { TokensService } from './../tokens/tokens.service';
import { AdminConfig } from './../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { AccountNotVerifiedException } from '../../exceptions/account-not-verified.exception';
import { AccountDisabledException } from '../../exceptions/account-disabled.exception';
import { User, UserDocument } from './schemas/user.schema';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminUpdateUserDto,
  RoleDto,
} from '@agoracloud/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isDefined } from 'class-validator';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService<Config>,
    private readonly tokensService: TokensService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.createAdminUser();
  }

  /**
   * Checks if the admin user has been created. If not,
   * the admin user is created.
   */
  private async createAdminUser(): Promise<void> {
    const adminConfig: AdminConfig =
      this.configService.get<AdminConfig>('admin');
    try {
      await this.findByEmail(adminConfig.email);
    } catch (err) {
      // Admin user has not been created yet, create it
      const createUserDto: CreateUserDto = {
        email: adminConfig.email,
        fullName: 'Admin',
        password: adminConfig.password,
      };
      // Add an artificial delay, the event emitter does not emit any events on initialization
      setTimeout(() => this.create(createUserDto, RoleDto.SuperAdmin), 2000);
    }
  }

  /**
   * Create a user
   * @param createUserDto the user to create
   * @param role the users role
   * @param verify verify the user
   * @returns the created user document
   */
  async create(
    createUserDto: CreateUserDto,
    role: RoleDto.User | RoleDto.SuperAdmin = RoleDto.User,
    verify = false,
  ): Promise<UserDocument> {
    const user: User = new User({
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      password: await this.hash(createUserDto.password),
    });
    if (role === RoleDto.SuperAdmin || verify) {
      user.isVerified = true;
    }
    const createdUser: UserDocument = await this.userModel.create(user);
    let verifyAccountToken: TokenDocument;
    if (!createdUser.isVerified) {
      verifyAccountToken = await this.createVerifyAccountToken(createdUser);
    }
    this.eventEmitter.emit(
      Event.UserCreated,
      new UserCreatedEvent(createdUser, verifyAccountToken?._id, role),
    );
    return createdUser;
  }

  /**
   * Find all users
   * @returns an array of user documents
   */
  async findAll(): Promise<UserDocument[]> {
    const users: UserDocument[] = await this.userModel.find().exec();
    return users;
  }

  /**
   * Find a user by id
   * @param userId the users id
   * @throws UserWithIdNotFoundException
   * @returns a user document
   */
  async findOne(userId: string): Promise<UserDocument> {
    const user: UserDocument = await this.userModel
      .findOne({ _id: userId })
      .exec();
    if (!user) throw new UserWithIdNotFoundException(userId);
    return user;
  }

  /**
   * Find a user by email
   * @param email the users email
   * @param checkEnabledAndVerified check if the user is enabled and verified
   * @throws UserNotFoundException
   * @throws AccountDisabledException
   * @throws AccountNotVerifiedException
   * @returns a user document
   */
  async findByEmail(
    email: string,
    checkEnabledAndVerified = true,
  ): Promise<UserDocument> {
    const user: UserDocument = await this.userModel.findOne({ email }).exec();
    if (!user) throw new UserNotFoundException(email);
    if (!checkEnabledAndVerified) return user;
    if (!user.isEnabled) throw new AccountDisabledException(email);
    if (!user.isVerified) throw new AccountNotVerifiedException(email);
    return user;
  }

  /**
   * Find a user by email and refresh token
   * @param email the users email
   * @param refreshToken the users latest refresh token
   * @returns a user document
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
   * @throws UserWithIdNotFoundException
   */
  async doesExist(userId: string): Promise<void> {
    const exists: boolean = await this.userModel.exists({ _id: userId });
    if (!exists) throw new UserWithIdNotFoundException(userId);
  }

  /**
   * Update a user
   * @param userId the users id
   * @param updateUserDto the updated user
   * @returns the updated user document
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
   * Update a user, accessible by super admins only
   * @param userId the users id
   * @param adminUpdateUserDto the updated user
   * @returns the updated user document
   */
  async adminUpdate(
    userId: string,
    adminUpdateUserDto: AdminUpdateUserDto,
  ): Promise<UserDocument> {
    const user: UserDocument = await this.findOne(userId);
    user.fullName = adminUpdateUserDto.fullName || user.fullName;
    if (adminUpdateUserDto.password) {
      user.password = await this.hash(adminUpdateUserDto.password);
    }
    if (isDefined(adminUpdateUserDto.isEnabled)) {
      user.isEnabled = adminUpdateUserDto.isEnabled;
    }
    if (isDefined(adminUpdateUserDto.isVerified)) {
      user.isVerified = adminUpdateUserDto.isVerified;
    }
    await this.userModel.updateOne({ _id: userId }, user).exec();
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
    const hashedRefreshToken: string = await this.hash(latestRefreshToken);
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
    const hashedPassword: string = await this.hash(password);
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
   * @returns the created token document
   */
  private createVerifyAccountToken(user: UserDocument): Promise<TokenDocument> {
    return this.tokensService.create({
      type: TokenType.VerifyAccount,
      user,
      expiresAt: addDays(new Date()),
    });
  }

  /**
   * Generates a hash for the given value
   * @param value the value to hash
   * @returns the hashed value of the given string
   */
  private async hash(value: string): Promise<string> {
    return bcrypt.hash(value, 10);
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
