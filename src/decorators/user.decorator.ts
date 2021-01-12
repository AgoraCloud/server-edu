import { RequestWithUser } from '../utils/requests.interface';
import { UserDocument } from '../modules/users/schemas/user.schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (field: string, ctx: ExecutionContext) => {
    const request: RequestWithUser = ctx.switchToHttp().getRequest();
    const user: UserDocument = request.user;
    return field ? user?.[field] : user;
  },
);
