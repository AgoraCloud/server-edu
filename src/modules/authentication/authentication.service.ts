import { PasswordChangedEvent } from '../../events/password-changed.event';
import { ForgotPasswordEvent } from '../../events/forgot-password.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TokenExpiredException } from './../../exceptions/token-expired.exception';
import { TokenType, TokenDocument } from '../tokens/schemas/token.schema';
import { TokensService } from './../tokens/tokens.service';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtConfig } from '../../config/configuration.interface';
import { TokenPayload } from './interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';
import { InvalidCredentialsException } from '../../exceptions/invalid-credentials.exception';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from 'src/modules/users/schemas/user.schema';
import { addDays } from 'src/utils/date';
import { Event } from 'src/events/events.enum';

@Injectable()
export class AuthenticationService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt');
  }

  /**
   * Creates a user
   * @param createUserDto the user to create
   */
  async register(createUserDto: CreateUserDto): Promise<void> {
    await this.userService.create(createUserDto);
  }

  /**
   * Used by the Passport strategy to verify the supplied user credentials
   * @param email the users email
   * @param password the users password
   */
  async validate(email: string, password: string): Promise<UserDocument> {
    const user: UserDocument = await this.userService.findByEmail(email);
    await this.passwordsMatch(password, user.password);
    return user;
  }

  /**
   * Checks if the plain text password and hashed passwords match
   * @param password the plain text password
   * @param hashedPassword the hashed password
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
   * Generates a jwt access token
   * @param email the users email
   */
  generateAccessToken(email: string): string {
    const payload = { email };
    const token: string = this.jwtService.sign(payload, {
      secret: this.jwtConfig.access.secret,
      expiresIn: `${this.jwtConfig.access.expirationTime}s`,
    });
    return token;
  }

  /**
   * Generates a jwt refresh token
   * @param email the users email
   */
  async generateRefreshToken(email: string): Promise<string> {
    const payload = { email };
    const token: string = this.jwtService.sign(payload, {
      secret: this.jwtConfig.refresh.secret,
      expiresIn: `${this.jwtConfig.refresh.expirationTime}s`,
    });

    await this.userService.updateRefreshToken(email, token);
    return token;
  }

  /**
   * Generates cookies to clear the browsers jwt and jwt_refresh cookies
   *  @param email the users email
   */
  async clearRefreshToken(email: string): Promise<void> {
    await this.userService.clearRefreshToken(email);
  }

  /**
   * Validates a jwt token
   * @param token the token to validate
   */
  validateJwtToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.jwtConfig.access.secret,
    });
  }

  /**
   * Validates a jwt refresh token
   * @param token the token to validate
   */
  validateJwtRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.jwtConfig.refresh.secret,
    });
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
      expiresAt: addDays(new Date()),
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
    if (this.tokensService.isTokenExpired(token)) {
      throw new TokenExpiredException(token._id);
    }
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
    if (this.tokensService.isTokenExpired(token)) {
      throw new TokenExpiredException(token._id);
    }
    await this.userService.verify(token.user._id);
  }
}
