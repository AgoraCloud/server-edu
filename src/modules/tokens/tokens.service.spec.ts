import { addDays } from '../../utils/date';
import { User, UserSchema } from './../users/schemas/user.schema';
import { TokenNotFoundException } from './../../exceptions/token-not-found.exception';
import { UserDocument } from '../users/schemas/user.schema';
import {
  Token,
  TokenSchema,
  TokenType,
  TokenDocument,
} from './schemas/token.schema';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { Test, TestingModule } from '@nestjs/testing';
import { TokensService } from './tokens.service';
import { Connection, Types } from 'mongoose';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
} as UserDocument;

const token: Token = new Token({
  type: TokenType.ChangePassword,
  user,
  expiresAt: new Date(),
});

let tokenId: string;

describe('TokensService', () => {
  let service: TokensService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [TokensService],
    }).compile();

    service = module.get<TokensService>(TokensService);
    connection = await module.get(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a token', async () => {
      const createdToken: TokenDocument = await service.create(token);
      expect(createdToken.type).toBe(token.type);
      expect(createdToken.user._id).toBe(user._id);
      expect(createdToken.expiresAt).toBe(token.expiresAt);
      tokenId = createdToken._id;
    });
  });

  describe('findOneAndRemove', () => {
    it('should throw an error if the token was not found', async () => {
      const tokenId = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new TokenNotFoundException(tokenId)
        .message;
      try {
        await service.findOneAndRemove(tokenId, token.type as TokenType);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the token and remove it', async () => {
      const retrievedToken: TokenDocument = await service.findOneAndRemove(
        tokenId,
        token.type as TokenType,
      );
      expect(retrievedToken._id).toEqual(tokenId);
      expect(retrievedToken.type).toBe(token.type);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true if the token is expired', () => {
      expect(service.isTokenExpired(token as TokenDocument)).toBe(true);
    });

    it('should return false if the token is not expired', () => {
      token.expiresAt = addDays(new Date());
      expect(service.isTokenExpired(token as TokenDocument)).toBe(false);
    });
  });
});
