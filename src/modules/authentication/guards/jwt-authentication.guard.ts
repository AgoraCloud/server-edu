import { Request, Response } from 'express';
import { AuthenticationService } from '../authentication.service';
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthenticationGuard extends AuthGuard('jwt') {
  constructor(
    @Inject('AuthenticationService')
    private readonly authenticationService: AuthenticationService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    await this.authenticationService.canActivate(request, response);
    return this.activate(context);
  }

  async activate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any): any {
    if (err || !user) throw new UnauthorizedException();
    return user;
  }
}
