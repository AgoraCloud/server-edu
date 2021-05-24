import { AuthorizationGuard } from './../modules/authorization/guards/authorization.guard';
import { JwtAuthenticationGuard } from './../modules/authentication/guards/jwt-authentication.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Permissions } from './permissions.decorator';
import { ActionDto } from '@agoracloud/common';

/**
 * A decorator that applies permissions metadata, authentication and authorization
 * functionality to routes (controllers and methods)
 * @param permissions the permissions needed to activate this route
 * @returns a fully configured authentication and authorization decorator
 */
export function Auth(...permissions: ActionDto[]) {
  return applyDecorators(
    Permissions(...permissions),
    UseGuards(JwtAuthenticationGuard, AuthorizationGuard),
  );
}
