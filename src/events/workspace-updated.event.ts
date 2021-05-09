import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';

/**
 * Payload of the workspace.updated event
 */
export class WorkspaceUpdatedEvent {
  workspace: WorkspaceDocument;

  constructor(workspace: WorkspaceDocument) {
    this.workspace = workspace;
  }
}
