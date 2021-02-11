import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';
export class WorkspaceUpdatedEvent {
  workspace: WorkspaceDocument;

  constructor(workspace: WorkspaceDocument) {
    this.workspace = workspace;
  }
}
