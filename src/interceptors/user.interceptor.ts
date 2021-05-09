import { UsersService } from './../modules/users/users.service';
import { InvalidMongoIdException } from './../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import { Request } from 'express';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * An interceptor that extracts the user id from the request and checks
 * whether the user exists or not
 */
@Injectable()
export class UserInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();
    const userId: string = request.params.userId;
    if (!isMongoId(userId)) {
      throw new InvalidMongoIdException('userId');
    }
    await this.usersService.doesExist(userId);
    return next.handle();
  }
}
