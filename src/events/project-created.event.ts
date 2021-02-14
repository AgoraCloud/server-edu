import { ProjectDocument } from './../modules/projects/schemas/project.schema';

export class ProjectCreatedEvent {
  project: ProjectDocument;

  constructor(project: ProjectDocument) {
    this.project = project;
  }
}
