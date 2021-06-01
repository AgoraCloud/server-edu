import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithIsAdmin } from '../utils/requests.interface';

/**
 * A method decorator that extracts the isAdmin property from the request
 */
export const IsAdmin = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request: RequestWithIsAdmin = ctx.switchToHttp().getRequest();
    return request.isAdmin;
  },
);
