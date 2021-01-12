import { UserDocument } from 'src/modules/users/schemas/user.schema';
import { accessTokenConstants, refreshTokenConstants } from '../constants';
import { UsersService } from 'src/modules/users/users.service';
import { Request, Response } from 'express';
import { AuthenticationService } from '../authentication.service';
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class JwtAuthenticationGuard extends AuthGuard('jwt') {
  constructor(
    @Inject('AuthenticationService')
    private readonly authenticationService: AuthenticationService,
    @Inject('UsersService')
    private readonly userService: UsersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    try {
      // Check the access token
      const accessToken: string = request.cookies?.jwt;
      if (!accessToken) throw new UnauthorizedException();
      let isValidAccessToken: TokenPayload;
      try {
        isValidAccessToken = this.authenticationService.validateJwtToken(
          accessToken,
        );
      } catch (err) {
        // Catch TokenExpiredError, do nothing
      }
      if (isValidAccessToken) return this.activate(context);

      // Check the refresh token
      const refreshToken: string = request.cookies?.jwt_refresh;
      if (!refreshToken) throw new UnauthorizedException();
      const isValidRefreshToken: TokenPayload = this.authenticationService.validateJwtRefreshToken(
        refreshToken,
      );
      if (!isValidRefreshToken) throw new UnauthorizedException();

      // Check if the user has the refresh token
      const email: string = isValidRefreshToken.email;
      const user: UserDocument = await this.userService.findByEmailAndRefreshToken(
        email,
        refreshToken,
      );
      if (!user) throw new UnauthorizedException();

      // Generate and set the new access token
      const newAccessToken: string = this.authenticationService.generateAccessToken(
        email,
      );
      request.cookies[accessTokenConstants.name] = newAccessToken;
      response.cookie(
        accessTokenConstants.name,
        newAccessToken,
        accessTokenConstants.cookieOptions,
      );
      return this.activate(context);
    } catch (err) {
      response.clearCookie(
        accessTokenConstants.name,
        accessTokenConstants.cookieOptions,
      );
      response.clearCookie(
        refreshTokenConstants.name,
        refreshTokenConstants.cookieOptions,
      );
      throw new UnauthorizedException();
    }
  }

  async activate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err, user) {
    if (err || !user) throw new UnauthorizedException();
    return user;
  }
}
