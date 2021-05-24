import { RoleDto } from '@agoracloud/common';
import { UserDocument } from '../modules/users/schemas/user.schema';

/**
 * Payload of the user.created event
 */
export class UserCreatedEvent {
  user: UserDocument;
  token: string;
  role: RoleDto.SuperAdmin | RoleDto.User;

  constructor(
    user: UserDocument,
    token: string,
    role: RoleDto.SuperAdmin | RoleDto.User,
  ) {
    this.user = user;
    this.token = token;
    this.role = role;
  }
}
