/**
 * Payload of the workspace.deleted event
 */
export class WorkspaceDeletedEvent {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}
