export class WorkspaceNamespace {
  workspaceId: string;
  namespace: string;

  constructor(workspaceId: string, namespace: string) {
    this.workspaceId = workspaceId;
    this.namespace = namespace;
  }
}
