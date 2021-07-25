import { AuthenticationService } from './../authentication.service';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { Config, JwtConfig } from '../../../config/configuration.interface';
import { AuthTokenType } from '../config/cookie.config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return AuthenticationService.getTokenFromRequest(
            request,
            AuthTokenType.Refresh,
          );
        },
      ]),
      secretOrKey: configService.get<JwtConfig>('jwt').refresh.secret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload): Promise<User> {
    const refreshToken: string = AuthenticationService.getTokenFromRequest(
      request,
      AuthTokenType.Refresh,
    );
    return this.userService.findByEmailAndRefreshToken(
      payload.email,
      refreshToken,
    );
  }
}
