import { ProjectDocument } from './../modules/projects/schemas/project.schema';

/**
 * Payload of the project.created event
 */
export class ProjectCreatedEvent {
  project: ProjectDocument;

  constructor(project: ProjectDocument) {
    this.project = project;
  }
}
