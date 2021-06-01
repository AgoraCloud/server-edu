import { AuthorizationService } from './../authorization.service';
import { UserDocument } from './../../users/schemas/user.schema';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../../../decorators/permissions.decorator';
import { RequestWithUserAndIsAdmin } from '../../../utils/requests.interface';
import { ActionDto } from '@agoracloud/common';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions: ActionDto[] =
      this.reflector.getAllAndMerge<ActionDto[]>(PERMISSIONS_KEY, [
        context.getClass(),
        context.getHandler(),
      ]) || [];
    if (!permissions.length) return true;
    const request: RequestWithUserAndIsAdmin = context
      .switchToHttp()
      .getRequest();
    const user: UserDocument = request.user;
    const workspaceId: string = request.params.workspaceId;
    const { canActivate, isAdmin } = await this.authorizationService.can(
      user,
      permissions,
      workspaceId,
    );
    request.isAdmin = isAdmin;
    return canActivate;
  }
}
