import { UserDocument } from '../modules/users/schemas/user.schema';

/**
 * Payload of the user.forgotPassword event
 */
export class ForgotPasswordEvent {
  user: UserDocument;
  token: string;

  constructor(user: UserDocument, token: string) {
    this.user = user;
    this.token = token;
  }
}
