import { UserDto } from './../users/dto/user.dto';
import { TransformInterceptor } from './../../interceptors/transform.interceptor';
import { MongoExceptionFilter } from './../../filters/mongo-exception.filter';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { accessTokenConstants, refreshTokenConstants } from './constants';
import { UserDocument } from '../users/schemas/user.schema';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { JwtAuthenticationGuard } from './guards/jwt-authentication.guard';
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
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@Controller('api/auth')
@ApiTags('Authentication')
@UseFilters(new MongoExceptionFilter())
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<void> {
    return this.authenticationService.register(createUserDto);
  }

  @Post('login')
  @ApiCookieAuth()
  @UseGuards(LocalAuthenticationGuard)
  @UseInterceptors(new TransformInterceptor(UserDto))
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

  @HttpCode(200)
  @Post('logout')
  @ApiCookieAuth()
  @UseGuards(JwtAuthenticationGuard)
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

  @Post('refresh')
  @ApiCookieAuth()
  @UseGuards(JwtRefreshGuard)
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

  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    return this.authenticationService.forgotPassword(forgotPasswordDto);
  }

  @HttpCode(200)
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authenticationService.changePassword(changePasswordDto);
  }

  @HttpCode(200)
  @Post('verify-account')
  async verifyAccount(
    @Body() verifyAccountDto: VerifyAccountDto,
  ): Promise<void> {
    return this.authenticationService.verifyAccount(verifyAccountDto);
  }
}
