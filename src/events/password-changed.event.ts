import { UserDocument } from '../modules/users/schemas/user.schema';

export class PasswordChangedEvent {
  user: UserDocument;

  constructor(user: UserDocument) {
    this.user = user;
  }
}
