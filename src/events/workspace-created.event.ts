import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';

export class WorkspaceCreatedEvent {
  workspace: WorkspaceDocument;

  constructor(workspace: WorkspaceDocument) {
    this.workspace = workspace;
  }
}
