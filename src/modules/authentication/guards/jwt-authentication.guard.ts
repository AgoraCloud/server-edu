import { UserDocument } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
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
import { AuthTokenType, COOKIE_CONFIG } from '../config/cookie.config';

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
      const accessToken: string = AuthenticationService.getTokenFromRequest(
        request,
        AuthTokenType.Access,
      );
      if (!accessToken) throw new UnauthorizedException();
      try {
        if (
          this.authenticationService.validateCookieToken(
            accessToken,
            AuthTokenType.Access,
          )
        ) {
          return this.activate(context);
        }
      } catch (err) {
        // Catch TokenExpiredError, do nothing
      }

      // Check the refresh token
      const refreshToken: string = AuthenticationService.getTokenFromRequest(
        request,
        AuthTokenType.Refresh,
      );
      if (!refreshToken) throw new UnauthorizedException();
      const decodedRefreshToken: TokenPayload =
        this.authenticationService.validateCookieToken(
          refreshToken,
          AuthTokenType.Refresh,
        );
      if (!decodedRefreshToken) throw new UnauthorizedException();

      // Check if the user has the refresh token
      const email: string = decodedRefreshToken.email;
      const user: UserDocument =
        await this.userService.findByEmailAndRefreshToken(email, refreshToken);
      if (!user) throw new UnauthorizedException();

      // Generate and set the new access token (in the response)
      const newAccessToken: string =
        await this.authenticationService.generateAndSetCookie(
          user,
          response,
          AuthTokenType.Access,
        );
      // Set the new access token in the current request
      request.cookies[COOKIE_CONFIG[AuthTokenType.Access].name] =
        newAccessToken;
      return this.activate(context);
    } catch (err) {
      // Something went wrong, clear the users access and refresh tokens
      await this.authenticationService.logOut(response);
      throw new UnauthorizedException();
    }
  }

  async activate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any): any {
    if (err || !user) throw new UnauthorizedException();
    return user;
  }
}
