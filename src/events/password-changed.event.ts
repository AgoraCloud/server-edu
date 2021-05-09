import { UserDocument } from '../modules/users/schemas/user.schema';

/**
 * Payload of the user.passwordChanged event
 */
export class PasswordChangedEvent {
  user: UserDocument;

  constructor(user: UserDocument) {
    this.user = user;
  }
}
