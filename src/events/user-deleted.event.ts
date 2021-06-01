/**
 * Payload of the user.deleted event
 */
export class UserDeletedEvent {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
