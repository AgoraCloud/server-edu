/**
 * Payload of the project.lane.deleted event
 */
export class ProjectLaneDeletedEvent {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
