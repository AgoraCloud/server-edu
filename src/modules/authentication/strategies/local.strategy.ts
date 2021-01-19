import { User } from '../../users/schemas/user.schema';
import { AuthenticationService } from '../authentication.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticationService: AuthenticationService) {
    super({ usernameField: 'email' });
  }

  async validate(username: string, password: string): Promise<User> {
    return this.authenticationService.validate(username, password);
  }
}
