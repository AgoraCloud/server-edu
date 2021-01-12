import { UserDocument } from '../modules/users/schemas/user.schema';

export class UserCreatedEvent {
  user: UserDocument;
  token: string;

  constructor(user: UserDocument, token: string) {
    this.user = user;
    this.token = token;
  }
}
