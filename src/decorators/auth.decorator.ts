import { AuthorizationGuard } from './../modules/authorization/guards/authorization.guard';
import { JwtAuthenticationGuard } from './../modules/authentication/guards/jwt-authentication.guard';
import { Action } from './../modules/authorization/schemas/permission.schema';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Permissions } from './permissions.decorator';

/**
 * A decorator that applies permissions metadata, authentication and authorization
 * functionality to routes (controllers and methods)
 * @param permissions the permissions needed to activate this route
 * @returns a fully configured authentication and authorization decorator
 */
export function Auth(...permissions: Action[]) {
  return applyDecorators(
    Permissions(...permissions),
    UseGuards(JwtAuthenticationGuard, AuthorizationGuard),
  );
}
