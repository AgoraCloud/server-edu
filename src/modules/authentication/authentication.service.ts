import { DateUtil } from './../../utils/date.util';
import { PasswordChangedEvent } from '../../events/password-changed.event';
import { ForgotPasswordEvent } from '../../events/forgot-password.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenType, TokenDocument } from '../tokens/schemas/token.schema';
import { TokensService } from './../tokens/tokens.service';
import {
  VerifyAccountDto,
  CreateUserDto,
  ChangePasswordDto,
  ForgotPasswordDto,
} from '@agoracloud/common';
import { Config, JwtConfig } from '../../config/configuration.interface';
import { TokenPayload } from './interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from '../users/schemas/user.schema';
import { Event } from '../../events/events.enum';
import {
  CookieConfig,
  AuthTokenType,
  COOKIE_CONFIG,
} from './config/cookie.config';
import { CookieOptions, Request, Response } from 'express';

@Injectable()
export class AuthenticationService {
  private readonly jwtConfig: JwtConfig;
  private readonly domain: string;
  private readonly accessCookieConfig: CookieConfig =
    COOKIE_CONFIG[AuthTokenType.Access];
  private readonly refreshCookieConfig: CookieConfig =
    COOKIE_CONFIG[AuthTokenType.Refresh];

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Config>,
    private readonly tokensService: TokensService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt');
    this.domain = this.configService.get<string>('domain');
  }

  /**
   * Creates a user
   * @param createUserDto the user to create
   */
  async register(createUserDto: CreateUserDto): Promise<void> {
    await this.userService.create(createUserDto);
  }

  /**
   * Authenticates a user by generating and setting the jwt access
   * and refresh tokens via cookies
   * @param user the user to log in
   * @param response the server response instance
   * @returns the user
   */
  async logIn(user: UserDocument, response: Response): Promise<UserDocument> {
    await this.generateAndSetCookie(user, response, AuthTokenType.Access);
    await this.generateAndSetCookie(user, response, AuthTokenType.Refresh);
    return user;
  }

  /**
   * Generates and sets a jwt access or refresh token via cookies
   * @param user the user
   * @param response the server response instance
   * @param authTokenType the authentication token type
   * @returns the generated jwt token
   */
  async generateAndSetCookie(
    user: UserDocument,
    response: Response,
    authTokenType: AuthTokenType,
  ): Promise<string> {
    const generatedToken: string = await this.generateToken(
      user.email,
      authTokenType,
    );
    let cookieKey: string;
    let cookieOptions: CookieOptions;
    let maxAge: number;
    if (authTokenType === AuthTokenType.Access) {
      cookieKey = this.accessCookieConfig.name;
      cookieOptions = this.accessCookieConfig.cookieOptions;
      maxAge = this.accessCookieConfig.expirationTime * 1000;
    } else if (authTokenType === AuthTokenType.Refresh) {
      cookieKey = this.refreshCookieConfig.name;
      cookieOptions = this.refreshCookieConfig.cookieOptions;
      maxAge = this.refreshCookieConfig.expirationTime * 1000;
    }
    response.cookie(cookieKey, generatedToken, {
      ...cookieOptions,
      maxAge,
      domain: this.domain,
    });
    return generatedToken;
  }

  /**
   * Logs a user out by clearing the jwt access and refresh cookies
   * @param response the server response instance
   * @param user the user
   */
  async logOut(response: Response, user?: UserDocument): Promise<void> {
    if (user) {
      await this.clearRefreshToken(user.email);
    }
    response.clearCookie(this.accessCookieConfig.name);
    response.clearCookie(this.refreshCookieConfig.name);
  }

  /**
   * Generates a new jwt refresh token and updates the users refresh cookie
   * @param user the user
   * @param response the server response instance
   */
  async refreshToken(user: UserDocument, response: Response): Promise<void> {
    await this.generateAndSetCookie(user, response, AuthTokenType.Refresh);
  }

  /**
   * Trigger the forgot password flow to change a users password
   * @param forgotPasswordDto forgot password details
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const user: UserDocument = await this.userService.findByEmail(
      forgotPasswordDto.email,
    );
    const token: TokenDocument = await this.tokensService.create({
      type: TokenType.ChangePassword,
      user,
      expiresAt: DateUtil.addDays(new Date()),
    });
    this.eventEmitter.emit(
      Event.ForgotPassword,
      new ForgotPasswordEvent(user, token._id),
    );
  }

  /**
   * Change a users password
   * @param changePasswordDto password change details
   */
  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    const token: TokenDocument = await this.tokensService.findOneAndRemove(
      changePasswordDto.token,
      TokenType.ChangePassword,
    );
    this.tokensService.isTokenExpired(token);
    await this.userService.updatePassword(
      token.user._id,
      changePasswordDto.password,
    );
    this.eventEmitter.emit(
      Event.PasswordChanged,
      new PasswordChangedEvent(token.user),
    );
  }

  /**
   * Verify a users account
   * @param verifyAccountDto account verification details
   */
  async verifyAccount(verifyAccountDto: VerifyAccountDto): Promise<void> {
    const token: TokenDocument = await this.tokensService.findOneAndRemove(
      verifyAccountDto.token,
      TokenType.VerifyAccount,
    );
    this.tokensService.isTokenExpired(token);
    await this.userService.verify(token.user._id);
  }

  /**
   * Used by the Passport strategy to verify the supplied user credentials
   * @param email the users email
   * @param password the users password
   * @returns the user with the matching email and password
   */
  async validate(email: string, password: string): Promise<UserDocument> {
    const user: UserDocument = await this.userService.findByEmail(email);
    await this.passwordsMatch(password, user.password);
    return user;
  }

  /**
   * Validates a jwt access or refresh token from a cookie
   * @param token the token to validate
   * @param authTokenType the type of authentication token
   * @returns the decoded access or refresh token
   */
  validateCookieToken(
    token: string,
    authTokenType: AuthTokenType,
  ): TokenPayload {
    let secret: string;
    if (authTokenType === AuthTokenType.Access) {
      secret = this.jwtConfig.access.secret;
    } else if (authTokenType === AuthTokenType.Refresh) {
      secret = this.jwtConfig.refresh.secret;
    }
    return this.jwtService.verify<TokenPayload>(token, {
      secret,
    });
  }

  /**
   * Extracts a jwt access or refresh token from the cookies present
   * in the given request
   * @param request the server request instance
   * @param authTokenType the authentication token type
   * @returns the jwt token present in the cookie
   */
  static getTokenFromRequest(
    request: Request,
    authTokenType: AuthTokenType,
  ): string {
    return request.cookies[COOKIE_CONFIG[authTokenType].name];
  }

  /**
   * Generates a jwt access or refresh token
   * @param email the users email
   * @param authTokenType the authentication token type
   * @returns the generated access or refresh token
   */
  private async generateToken(
    email: string,
    authTokenType: AuthTokenType,
  ): Promise<string> {
    let secret: string;
    let expiresIn: number;
    if (authTokenType === AuthTokenType.Access) {
      secret = this.jwtConfig.access.secret;
      expiresIn = this.accessCookieConfig.expirationTime;
    } else if (authTokenType === AuthTokenType.Refresh) {
      secret = this.jwtConfig.refresh.secret;
      expiresIn = this.refreshCookieConfig.expirationTime;
    }
    const generatedToken: string = this.jwtService.sign(
      { email },
      {
        secret,
        expiresIn: `${expiresIn}s`,
      },
    );
    if (authTokenType === AuthTokenType.Refresh) {
      await this.userService.updateRefreshToken(email, generatedToken);
    }
    return generatedToken;
  }

  /**
   * Checks if the plain text password and hashed passwords match
   * @param password the plain text password
   * @param hashedPassword the hashed password
   * @throws InvalidCredentialsException
   */
  private async passwordsMatch(
    password: string,
    hashedPassword: string,
  ): Promise<void> {
    const passwordsMatch: boolean = await bcrypt.compare(
      password,
      hashedPassword,
    );
    if (!passwordsMatch) throw new InvalidCredentialsException();
  }

  /**
   * Clears the users refresh token from the database
   * @param email the users email
   */
  private async clearRefreshToken(email: string): Promise<void> {
    await this.userService.clearRefreshToken(email);
  }
}
