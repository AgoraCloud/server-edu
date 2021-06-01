import { WorkspaceDocument } from './../modules/workspaces/schemas/workspace.schema';

/**
 * Payload of the workspace.created event
 */
export class WorkspaceCreatedEvent {
  workspace: WorkspaceDocument;

  constructor(workspace: WorkspaceDocument) {
    this.workspace = workspace;
  }
}
