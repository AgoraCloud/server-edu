import { Role } from '../modules/authorization/schemas/permission.schema';
import { UserDocument } from '../modules/users/schemas/user.schema';

export class UserCreatedEvent {
  user: UserDocument;
  token: string;
  role: Role.SuperAdmin | Role.User;

  constructor(
    user: UserDocument,
    token: string,
    role: Role.SuperAdmin | Role.User = Role.User,
  ) {
    this.user = user;
    this.token = token;
    this.role = role;
  }
}
