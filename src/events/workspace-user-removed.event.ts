/**
 * Payload of the workspace.user.removed event
 */
export class WorkspaceUserRemovedEvent {
  workspaceId: string;
  userId: string;

  constructor(workspaceId: string, userId: string) {
    this.workspaceId = workspaceId;
    this.userId = userId;
  }
}
