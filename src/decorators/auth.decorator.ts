import { AuthorizationGuard } from './../modules/authorization/guards/authorization.guard';
import { JwtAuthenticationGuard } from './../modules/authentication/guards/jwt-authentication.guard';
import { Action } from './../modules/authorization/schemas/permission.schema';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Permissions } from './permissions.decorator';

export function Auth(...permissions: Action[]) {
  return applyDecorators(
    Permissions(...permissions),
    UseGuards(JwtAuthenticationGuard, AuthorizationGuard),
  );
}
