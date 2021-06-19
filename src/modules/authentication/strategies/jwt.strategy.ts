import { Injectable } from '@nestjs/common';
import { TokenPayload } from '../interfaces/token-payload.interface';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../../users/schemas/user.schema';
import { Config, JwtConfig } from 'src/config/configuration.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.jwt;
        },
      ]),
      secretOrKey: configService.get<JwtConfig>('jwt').access.secret,
    });
  }

  async validate(payload: TokenPayload): Promise<User> {
    return this.userService.findByEmail(payload.email);
  }
}
