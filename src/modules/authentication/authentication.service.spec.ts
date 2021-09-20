import { RequestWithUser } from '../../utils/requests.interface';
import { TokenPayload } from './interfaces/token-payload.interface';
import { InvalidCredentialsException } from './../../exceptions/invalid-credentials.exception';
import { TokenExpiredException } from './../../exceptions/token-expired.exception';
import { User, UserDocument } from './../users/schemas/user.schema';
import {
  TokenSchema,
  TokenDocument,
  TokenType,
  Token,
} from './../tokens/schemas/token.schema';
import { PassportModule } from '@nestjs/passport';
import { UserSchema } from './../users/schemas/user.schema';
import {
  getConnectionToken,
  MongooseModule,
  getModelToken,
} from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { TokensService } from './../tokens/tokens.service';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../../modules/users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { Connection, Model } from 'mongoose';
import { JwtConfig } from '../../config/configuration.interface';
import {
  ChangePasswordDto,
  CreateUserDto,
  ForgotPasswordDto,
  RoleDto,
  VerifyAccountDto,
} from '@agoracloud/common';
import { AuthTokenType, COOKIE_CONFIG } from './config/cookie.config';
import { Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';

let user: UserDocument;
const createUserDto: CreateUserDto = {
  fullName: 'Test User',
  email: 'test@test.com',
  password: 'Password123',
};
const jwtConfig: JwtConfig = {
  access: {
    secret: 'secret',
  },
  refresh: {
    secret: 'refresh_secret',
  },
};
const domainConfig = 'agoracloud.test.com';

const accessCookieKey = COOKIE_CONFIG[AuthTokenType.Access].name;
const refreshCookieKey = COOKIE_CONFIG[AuthTokenType.Refresh].name;

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let connection: Connection;
  let usersService: UsersService;
  let tokensService: TokensService;
  let eventEmitter: EventEmitter2;
  let tokensModel: Model<TokenDocument>;
  let usersModel: Model<UserDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({ secret: jwtConfig.access.secret }),
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
        ConfigModule,
      ],
      providers: [
        AuthenticationService,
        UsersService,
        {
          provide: ConfigService,
          useValue: {
            get(key: string) {
              switch (key) {
                case 'jwt': {
                  return jwtConfig;
                }
                case 'domain': {
                  return domainConfig;
                }
              }
            },
          },
        },
        TokensService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    connection = await module.get(getConnectionToken());
    usersService = module.get<UsersService>(UsersService);
    tokensService = module.get<TokensService>(TokensService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    tokensModel = module.get<Model<TokenDocument>>(getModelToken(Token.name));
    usersModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register the user', async () => {
      const usersServiceSpy: jest.SpyInstance<
        Promise<UserDocument>,
        [
          createUserDto: CreateUserDto,
          role?: RoleDto.User | RoleDto.SuperAdmin,
          verify?: boolean,
        ]
      > = jest.spyOn(usersService, 'create');
      await service.register(createUserDto);
      expect(usersServiceSpy).toHaveBeenCalledTimes(1);
    });

    afterAll(async () => {
      // Get the user after registration
      user = await usersModel.findOne({ email: createUserDto.email }).exec();
    });
  });

  describe('verifyAccount', () => {
    it('should verify the users account', async () => {
      // Get the account verification token
      const token: TokenDocument = await tokensModel
        .findOne({ user: user._id, type: TokenType.VerifyAccount })
        .exec();
      const verifyAccountDto: VerifyAccountDto = {
        token: token._id,
      };
      const tokensServiceSpy: jest.SpyInstance<
        Promise<TokenDocument>,
        [tokenId: string, type: TokenType]
      > = jest.spyOn(tokensService, 'findOneAndRemove');
      const usersServiceSpy: jest.SpyInstance<Promise<void>, [userId: string]> =
        jest.spyOn(usersService, 'verify');
      await service.verifyAccount(verifyAccountDto);
      expect(tokensServiceSpy).toHaveBeenCalledTimes(1);
      expect(usersServiceSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the given verify account token is expired', async () => {
      // Create a new token with an expired date
      const expiredToken: TokenDocument = await tokensModel.create({
        type: TokenType.VerifyAccount,
        user,
        expiresAt: new Date(),
      });
      const verifyAccountDto: VerifyAccountDto = {
        token: expiredToken._id,
      };
      const expectedErrorMessage: string = new TokenExpiredException(
        expiredToken._id,
      ).message;
      try {
        await service.verifyAccount(verifyAccountDto);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });
  });

  describe('logIn', () => {
    it('should log the user in by generating and setting the access and refresh cookies', async () => {
      const mockCookieFunction: jest.Mock = jest.fn();
      const response: Response = {
        cookie: mockCookieFunction,
      } as any;
      await service.logIn(user, response);
      expect(mockCookieFunction.mock.calls).toHaveLength(2);
    });
  });

  describe('logOut', () => {
    it('should log the user out by clearing the access and refresh cookies', async () => {
      const mockClearCookieFunction: jest.Mock = jest.fn();
      const response: Response = {
        clearCookie: mockClearCookieFunction,
      } as any;
      const usersServiceSpy: jest.SpyInstance<Promise<void>, [email: string]> =
        jest.spyOn(usersService, 'clearRefreshToken');
      await service.logOut(response, user);
      expect(mockClearCookieFunction.mock.calls).toHaveLength(2);
      expect(usersServiceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshToken', () => {
    it('should generate a new refresh token and update the refresh cookie', async () => {
      const mockCookieFunction: jest.Mock = jest.fn();
      const response: Response = {
        cookie: mockCookieFunction,
      } as any;
      const usersServiceSpy: jest.SpyInstance<
        Promise<void>,
        [email: string, latestRefreshToken: string]
      > = jest.spyOn(usersService, 'updateRefreshToken');
      await service.refreshToken(user, response);
      expect(mockCookieFunction.mock.calls).toHaveLength(1);
      expect(usersServiceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('validate', () => {
    it('should throw an error if incorrect credentials are supplied', async () => {
      const expectedErrorMessage: string = new InvalidCredentialsException()
        .message;
      try {
        await service.validate(createUserDto.email, 'RandomPassword');
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should return the user if the correct credentials are supplied', async () => {
      const user: UserDocument = await service.validate(
        createUserDto.email,
        createUserDto.password,
      );
      expect(user).toBeTruthy();
      expect(user.email).toBe(createUserDto.email);
    });
  });

  describe('forgotPassword', () => {
    it('should create a change password token and emit the forgot password event', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: user.email,
      };
      const tokensServiceSpy: jest.SpyInstance<
        Promise<TokenDocument>,
        [token: Token]
      > = jest.spyOn(tokensService, 'create');
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      await service.forgotPassword(forgotPasswordDto);
      expect(tokensServiceSpy).toHaveBeenCalledTimes(1);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('changePassword', () => {
    it('should update the users password', async () => {
      // Get the change password token
      const token: TokenDocument = await tokensModel
        .findOne({ user: user._id, type: TokenType.ChangePassword })
        .exec();
      const changePasswordDto: ChangePasswordDto = {
        token: token._id,
        password: 'Password12345',
      };
      const usersServiceSpy: jest.SpyInstance<
        Promise<void>,
        [userId: string, password: string]
      > = jest.spyOn(usersService, 'updatePassword');
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      eventEmitterSpy.mockClear();
      await service.changePassword(changePasswordDto);
      expect(usersServiceSpy).toHaveBeenCalledTimes(1);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the given change password token is expired', async () => {
      // Create a new token with an expired date
      const expiredToken: TokenDocument = await tokensModel.create({
        type: TokenType.ChangePassword,
        user,
        expiresAt: new Date(),
      });
      const changePasswordDto: ChangePasswordDto = {
        token: expiredToken._id,
        password: 'Password12345',
      };
      const expectedErrorMessage: string = new TokenExpiredException(
        expiredToken._id,
      ).message;
      try {
        await service.changePassword(changePasswordDto);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });
  });

  describe('getTokenFromRequest', () => {
    it('should return the access token from the given request', () => {
      const request: Request = { cookies: {} } as any;
      request.cookies[accessCookieKey] = 'access_token';
      const retrievedToken: string = AuthenticationService.getTokenFromRequest(
        request,
        AuthTokenType.Access,
      );
      expect(retrievedToken).toBe(request.cookies[accessCookieKey]);
    });

    it('should return the refresh token from the given request', () => {
      const request: Request = { cookies: {} } as any;
      request.cookies[refreshCookieKey] = 'refresh_token';
      const retrievedToken: string = AuthenticationService.getTokenFromRequest(
        request,
        AuthTokenType.Refresh,
      );
      expect(retrievedToken).toBe(request.cookies[refreshCookieKey]);
    });
  });

  describe('canActivate', () => {
    const expectedErrorMessage: string = new UnauthorizedException().message;

    it('should throw an error if there is no access token in the request (websocket proxy request)', async () => {
      const request: Request = { cookies: {} } as any;
      const response: Response = {} as any;
      try {
        await service.canActivate(request, response, true);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the access token in the request is not valid (websocket proxy request)', async () => {
      const request: Request = { cookies: {} } as any;
      request.cookies[accessCookieKey] = 'jwt malformed';
      const response: Response = {} as any;
      try {
        await service.canActivate(request, response, true);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should return if the access token is valid', async () => {
      const request: Request = { cookies: {} } as any;
      const response: Response = {
        cookie: jest.fn(),
      } as any;
      // Generate and set a valid access token
      const validAccessToken: string = await service.generateAndSetCookie(
        user,
        response,
        AuthTokenType.Access,
      );
      request.cookies[accessCookieKey] = validAccessToken;

      try {
        await service.canActivate(request, response);
      } catch (err) {
        fail('It should not throw an error');
      }
    });

    it('should attach the user to the request and return if the access token is valid (websocket proxy request)', async () => {
      const request: RequestWithUser = { cookies: {} } as any;
      const response: Response = { cookie: jest.fn() } as any;
      // Generate and set a valid access token
      const validAccessToken: string = await service.generateAndSetCookie(
        user,
        response,
        AuthTokenType.Access,
      );
      request.cookies[accessCookieKey] = validAccessToken;

      try {
        await service.canActivate(request, response, true);
        expect(request.user).toBeTruthy();
        expect(request.user.email).toBe(user.email);
      } catch (err) {
        fail('It should not throw an error');
      }
    });

    it('it should throw an error if the access token is invalid and there is no refresh token in the request', async () => {
      const request: Request = { cookies: {} } as any;
      request.cookies[accessCookieKey] = 'jwt malformed';
      const mockClearCookieFunction: jest.Mock = jest.fn();
      const response: Response = {
        clearCookie: mockClearCookieFunction,
      } as any;
      try {
        await service.canActivate(request, response);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
        expect(mockClearCookieFunction.mock.calls).toHaveLength(2);
      }
    });

    it('it should throw an error if both the access and refresh tokens in the request are not valid', async () => {
      const request: Request = { cookies: {} } as any;
      request.cookies[accessCookieKey] = 'jwt malformed';
      request.cookies[refreshCookieKey] = 'jwt malformed';
      const mockClearCookieFunction: jest.Mock = jest.fn();
      const response: Response = {
        clearCookie: mockClearCookieFunction,
      } as any;
      try {
        await service.canActivate(request, response);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
        expect(mockClearCookieFunction.mock.calls).toHaveLength(2);
      }
    });

    it('should generate and set a new access token if the given access token is expired and a valid refresh token is supplied', async () => {
      const request: Request = { cookies: {} } as any;
      request.cookies[accessCookieKey] = 'jwt malformed';
      const mockCookieFunction: jest.Mock = jest.fn();
      const response: Response = { cookie: mockCookieFunction } as any;
      // Generate and set a valid refresh token
      const validRefreshToken: string = await service.generateAndSetCookie(
        user,
        response,
        AuthTokenType.Refresh,
      );
      request.cookies[refreshCookieKey] = validRefreshToken;
      mockCookieFunction.mockClear();

      try {
        await service.canActivate(request, response);
        expect(request.cookies[accessCookieKey]).not.toBe('jwt malformed');
        expect(mockCookieFunction.mock.calls).toHaveLength(1);
      } catch (err) {
        fail('It should not throw an error');
      }
    });
  });

  describe('validateCookieToken', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Generate an access and refresh token for testing token validation
      const response: Response = { cookie: jest.fn() } as any;
      accessToken = await service.generateAndSetCookie(
        user,
        response,
        AuthTokenType.Access,
      );
      refreshToken = await service.generateAndSetCookie(
        user,
        response,
        AuthTokenType.Refresh,
      );
    });

    it('should throw an error if the access token is not valid', () => {
      const randomToken = 'randomToken';
      const expectedErrorMessage = 'jwt malformed';
      try {
        service.validateCookieToken(randomToken, AuthTokenType.Access);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should return the decoded access token', () => {
      const decodedToken: TokenPayload = service.validateCookieToken(
        accessToken,
        AuthTokenType.Access,
      );
      expect(decodedToken).toBeTruthy();
      expect(decodedToken.email).toBe(user.email);
    });

    it('should throw an error if the refresh token is not valid', () => {
      const randomToken = 'randomToken';
      const expectedErrorMessage = 'jwt malformed';
      try {
        service.validateCookieToken(randomToken, AuthTokenType.Refresh);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should return the decoded refresh token', () => {
      const decodedToken: TokenPayload = service.validateCookieToken(
        refreshToken,
        AuthTokenType.Refresh,
      );
      expect(decodedToken).toBeTruthy();
      expect(decodedToken.email).toBe(user.email);
    });
  });
});
