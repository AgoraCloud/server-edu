import { MongoExceptionFilter } from './../../filters/mongo-exception.filter';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { accessTokenConstants, refreshTokenConstants } from './constants';
import { User as UserModel, UserDocument } from '../users/schemas/user.schema';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { JwtAuthenticationGuard } from './guards/jwt-authentication.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  HttpCode,
  UseFilters,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { Response } from 'express';
import { User } from '../../decorators/user.decorator';
import JwtRefreshGuard from './guards/jwt-refresh-authentication.guard';

@Controller('api/auth')
@UseFilters(new MongoExceptionFilter())
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto): Promise<void> {
    return this.authenticationService.register(createUserDto);
  }

  @Post('login')
  @UseGuards(LocalAuthenticationGuard)
  async logIn(
    @User() user: UserModel,
    @Res() response: Response,
  ): Promise<Response<UserDocument>> {
    const accessToken: string = this.authenticationService.generateAccessToken(
      user.email,
    );
    const refreshToken: string = await this.authenticationService.generateRefreshToken(
      user.email,
    );
    response.cookie(
      accessTokenConstants.name,
      accessToken,
      accessTokenConstants.cookieOptions,
    );
    response.cookie(
      refreshTokenConstants.name,
      refreshToken,
      refreshTokenConstants.cookieOptions,
    );
    return response.send(user);
  }

  @HttpCode(200)
  @Post('logout')
  @UseGuards(JwtAuthenticationGuard)
  async logOut(
    @User() user: UserModel,
    @Res() response: Response,
  ): Promise<Response<void>> {
    await this.authenticationService.clearRefreshToken(user.email);
    response.clearCookie(
      accessTokenConstants.name,
      accessTokenConstants.cookieOptions,
    );
    response.clearCookie(
      refreshTokenConstants.name,
      refreshTokenConstants.cookieOptions,
    );
    return response.send();
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refreshToken(
    @User() user: UserModel,
    @Res() response: Response,
  ): Promise<Response<void>> {
    const refreshToken: string = await this.authenticationService.generateRefreshToken(
      user.email,
    );
    response.cookie(
      refreshTokenConstants.name,
      refreshToken,
      refreshTokenConstants.cookieOptions,
    );
    return response.send();
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
