import { ExceptionDto } from './../../utils/base.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserDto } from './../users/dto/user.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { MongoExceptionFilter } from './../../filters/mongo-exception.filter';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { accessTokenConstants, refreshTokenConstants } from './constants';
import { UserDocument } from '../users/schemas/user.schema';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  UseFilters,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { Request as Req } from 'express';
import { User } from '../../decorators/user.decorator';
import JwtRefreshGuard from './guards/jwt-refresh-authentication.guard';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '../../decorators/auth.decorator';

@Controller('api/auth')
@ApiTags('Authentication')
@UseFilters(new MongoExceptionFilter())
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  /**
   * Create a new account
   * @param createUserDto the user to create
   */
  @Post('register')
  @ApiOperation({ summary: ' Create a new account' })
  @ApiCreatedResponse({
    description: 'The users account has been successfully created',
  })
  @ApiBadRequestResponse({
    description: 'The supplied email was in use',
    type: ExceptionDto,
  })
  register(@Body() createUserDto: CreateUserDto): Promise<void> {
    return this.authenticationService.register(createUserDto);
  }

  /**
   * Log in
   * @param request the request
   * @param user the user
   */
  @Post('login')
  @ApiCookieAuth()
  @UseGuards(LocalAuthenticationGuard)
  @ApiOperation({ summary: 'Log in' })
  @UseInterceptors(new TransformInterceptor(UserDto))
  @ApiCreatedResponse({
    description: 'The user has been successfully logged in',
  })
  @ApiBadRequestResponse({
    description: 'The supplied email and/or password were invalid',
    type: ExceptionDto,
  })
  @ApiForbiddenResponse({
    description: 'The user with the given email was disabled or not verified',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'The user with the given email was not found',
    type: ExceptionDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  @ApiBody({ type: SignInDto })
  async logIn(
    @Request() request: Req,
    @User() user: UserDocument,
  ): Promise<UserDocument> {
    const accessToken: string = this.authenticationService.generateAccessToken(
      user.email,
    );
    const refreshToken: string = await this.authenticationService.generateRefreshToken(
      user.email,
    );
    request.res.cookie(
      accessTokenConstants.name,
      accessToken,
      accessTokenConstants.cookieOptions,
    );
    request.res.cookie(
      refreshTokenConstants.name,
      refreshToken,
      refreshTokenConstants.cookieOptions,
    );
    return user;
  }

  /**
   * Sign out
   * @param request the request
   * @param user the user
   */
  @HttpCode(200)
  @Post('logout')
  @ApiCookieAuth()
  @Auth()
  @ApiOperation({ summary: 'Sign out' })
  @ApiOkResponse({ description: 'The user has been successfully logged out' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  async logOut(
    @Request() request: Req,
    @User() user: UserDocument,
  ): Promise<void> {
    await this.authenticationService.clearRefreshToken(user.email);
    request.res.clearCookie(
      accessTokenConstants.name,
      accessTokenConstants.cookieOptions,
    );
    request.res.clearCookie(
      refreshTokenConstants.name,
      refreshTokenConstants.cookieOptions,
    );
  }

  /**
   * Refresh a users access and refresh tokens
   * @param request the request
   * @param user the user
   */
  @Post('refresh')
  @ApiCookieAuth()
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh a users access and refresh tokens' })
  @ApiCreatedResponse({
    description:
      'The new access and refresh tokens were successfully refreshed',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized', type: ExceptionDto })
  async refreshToken(
    @Request() request: Req,
    @User() user: UserDocument,
  ): Promise<void> {
    const refreshToken: string = await this.authenticationService.generateRefreshToken(
      user.email,
    );
    request.res.cookie(
      refreshTokenConstants.name,
      refreshToken,
      refreshTokenConstants.cookieOptions,
    );
  }

  /**
   * Request a change password email
   * @param forgotPasswordDto the forgot password information
   */
  @HttpCode(200)
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a change password email' })
  @ApiOkResponse({
    description: 'The forgot password request has been successfully processed',
  })
  @ApiForbiddenResponse({
    description: 'The user with the given email was disabled or not verified',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'The user with the given email was not found',
    type: ExceptionDto,
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    return this.authenticationService.forgotPassword(forgotPasswordDto);
  }

  /**
   * Change a users password
   * @param changePasswordDto the change password information
   */
  @HttpCode(200)
  @Post('change-password')
  @ApiOperation({ summary: 'Change a users password' })
  @ApiOkResponse({
    description: 'The users password has been successfully changed',
  })
  @ApiBadRequestResponse({
    description:
      'The change password token was expired or the provided change password information was not valid',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description: 'The change password token with the given id was not found',
    type: ExceptionDto,
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authenticationService.changePassword(changePasswordDto);
  }

  /**
   * Verify a users account
   * @param verifyAccountDto the verify account information
   */
  @HttpCode(200)
  @Post('verify-account')
  @ApiOperation({ summary: 'Verify a users account' })
  @ApiOkResponse({
    description: 'The users account has been successfully verified',
  })
  @ApiBadRequestResponse({
    description:
      'The account verification token was expired or the provided account verification information was not valid',
    type: ExceptionDto,
  })
  @ApiNotFoundResponse({
    description:
      'The account verification token with the given id was not found',
    type: ExceptionDto,
  })
  async verifyAccount(
    @Body() verifyAccountDto: VerifyAccountDto,
  ): Promise<void> {
    return this.authenticationService.verifyAccount(verifyAccountDto);
  }
}
