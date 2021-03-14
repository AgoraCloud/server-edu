export class WorkspaceUserAddedEvent {
  workspaceId: string;
  userId: string;

  constructor(workspaceId: string, userId: string) {
    this.workspaceId = workspaceId;
    this.userId = userId;
  }
}
