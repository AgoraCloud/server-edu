import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.jwt_refresh;
        },
      ]),
      secretOrKey: configService.get<string>('jwt.refresh.secret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: TokenPayload): Promise<User> {
    const refreshToken: string = request.cookies?.jwt_refresh;
    return this.userService.findByEmailAndRefreshToken(
      payload.email,
      refreshToken,
    );
  }
}
