/**
 * Payload of the workspace.user.added event
 */
export class WorkspaceUserAddedEvent {
  workspaceId: string;
  userId: string;

  constructor(workspaceId: string, userId: string) {
    this.workspaceId = workspaceId;
    this.userId = userId;
  }
}
