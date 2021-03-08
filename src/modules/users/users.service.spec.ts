import { UserWithIdNotFoundException } from './../../exceptions/user-not-found.exception';
import { AccountNotVerifiedException } from './../../exceptions/account-not-verified.exception';
import { AccountDisabledException } from './../../exceptions/account-disabled.exception';
import { UserNotFoundException } from '../../exceptions/user-not-found.exception';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './../users/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { Token, TokenSchema } from './../tokens/schemas/token.schema';
import { TokensService } from './../tokens/tokens.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSchema } from './schemas/user.schema';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { Connection, Model, Types } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

let user: UserDocument;

describe('UsersService', () => {
  let service: UsersService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
      ],
      providers: [UsersService, EventEmitter2, ConfigService, TokensService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    connection = await module.get(getConnectionToken());
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    userModel = module.get<Model<UserDocument>>(getModelToken('User'));
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        fullName: 'Test User',
        email: 'test@test.com',
        password: 'Password123',
      };
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      const createdUser: UserDocument = await service.create(createUserDto);
      expect(createdUser.fullName).toBe(createUserDto.fullName);
      expect(createdUser.email).toBe(createUserDto.email);
      expect(createdUser.isEnabled).toBe(true);
      expect(createdUser.isVerified).toBe(false);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
      user = createdUser;
    });
  });

  describe('findByEmail', () => {
    it('should throw an error if the user was not found', async () => {
      const email = 'random@test.com';
      const expectedErrorMessage: string = new UserNotFoundException(email)
        .message;
      try {
        await service.findByEmail(email);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the user is not enabled', async () => {
      // Set user isEnabled to false
      await userModel.updateOne({ _id: user._id }, { isEnabled: false }).exec();
      const expectedErrorMessage: string = new AccountDisabledException(
        user.email,
      ).message;
      try {
        await service.findByEmail(user.email);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
      // Set user isEnabled to true
      await userModel.updateOne({ _id: user._id }, { isEnabled: true }).exec();
    });

    it('should throw an error if the user is not verified', async () => {
      const expectedErrorMessage: string = new AccountNotVerifiedException(
        user.email,
      ).message;
      try {
        await service.findByEmail(user.email);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the user by email', async () => {
      // Set user isEnabled to true
      await userModel.updateOne({ _id: user._id }, { isVerified: true }).exec();
      const retrievedUser: UserDocument = await service.findByEmail(user.email);
      expect(retrievedUser.email).toBe(user.email);
    });
  });

  describe('findByEmailAndRefreshToken', () => {
    it('should not return the user if the user with the given email and refresh token is not found', async () => {
      // Generate a random refresh token
      const refreshToken: string = Types.ObjectId().toHexString();
      const retrievedUser: UserDocument = await service.findByEmailAndRefreshToken(
        user.email,
        refreshToken,
      );
      expect(retrievedUser).not.toBeTruthy();
    });

    it('should return the user if the user with the given email and refresh token is found', async () => {
      // Create a refresh token and update the user
      const refreshToken: string = Types.ObjectId().toHexString();
      await service.updateRefreshToken(user.email, refreshToken);
      const retrievedUser: UserDocument = await service.findByEmailAndRefreshToken(
        user.email,
        refreshToken,
      );
      expect(retrievedUser).toBeTruthy();
      expect(retrievedUser.email).toBe(user.email);
      user = retrievedUser;
    });
  });

  describe('doesExist', () => {
    it('should throw an error if the user does not exist', async () => {
      const userId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new UserWithIdNotFoundException(
        userId,
      ).message;
      try {
        await service.doesExist(userId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });
  });

  describe('update', () => {
    it('should update the user', async () => {
      const updateUserDto: UpdateUserDto = {
        fullName: 'New Test User',
      };
      const updatedUser: UserDocument = await service.update(
        user._id,
        updateUserDto,
      );
      expect(updatedUser._id).toEqual(user._id);
      expect(updatedUser.fullName).toBe(updateUserDto.fullName);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update the users refresh token', async () => {
      const latestRefreshToken = 'NewToken';
      await service.updateRefreshToken(user.email, latestRefreshToken);
      // Retrieve the user and check if the refresh token was changed
      const retrievedUser: UserDocument = await service.findByEmail(user.email);
      expect(retrievedUser.latestRefreshToken).not.toBe(
        user.latestRefreshToken,
      );
    });
  });

  describe('clearRefreshToken', () => {
    it('should clear the users refresh token', async () => {
      await service.clearRefreshToken(user.email);
      // Retrieve the user and check if the refresh token was cleared
      const retrievedUser: UserDocument = await service.findByEmail(user.email);
      expect(retrievedUser.latestRefreshToken).not.toBeTruthy();
    });
  });

  describe('updatePassword', () => {
    it('should update the users password', async () => {
      await service.updatePassword(user._id, 'Password12345');
      // Retrieve the user and check if the password was updated
      const retrievedUser: UserDocument = await service.findByEmail(user.email);
      expect(retrievedUser.password).not.toBe(user.password);
    });
  });

  describe('verify', () => {
    beforeAll(async () => {
      // Set user isVerified to false
      await userModel
        .updateOne({ _id: user._id }, { isVerified: false })
        .exec();
    });

    it('should verify the user', async () => {
      await service.verify(user._id);
      // Retrieve the user and check if the user was verified
      const retrievedUser: UserDocument = await service.findByEmail(user.email);
      expect(retrievedUser.isVerified).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove the user', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      eventEmitterSpy.mockClear();
      await service.remove(user._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
