/**
 * Payload of the project.deleted event
 */
export class ProjectDeletedEvent {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
