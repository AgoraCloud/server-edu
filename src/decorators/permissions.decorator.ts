import { SetMetadata } from '@nestjs/common';
import { Action } from '../modules/authorization/schemas/permission.schema';

/**
 * The permissions metadata key, used to extract the permissions
 * from a method
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * A decorator that applies permissions metadata to routes
 * (controllers and methods)
 * @param permissions the permissions needed to activate this route
 * @returns a fully configured permissions decorator
 */
export const Permissions = (...permissions: Action[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
