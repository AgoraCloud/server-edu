/**
 * Represents all the possible internally emitted events.
 * For documentation, visit: https://github.com/AgoraCloud/server/wiki/Events.
 */
export enum Event {
  // User Events
  UserCreated = 'user.created',
  UserDeleted = 'user.deleted',
  ForgotPassword = 'user.forgotPassword',
  PasswordChanged = 'user.passwordChanged',
  // Workspace Events
  WorkspaceCreated = 'workspace.created',
  WorkspaceUpdated = 'workspace.updated',
  WorkspaceUserAdded = 'workspace.user.added',
  WorkspaceUserRemoved = 'workspace.user.removed',
  WorkspaceDeleted = 'workspace.deleted',
  // Deployment Events
  DeploymentCreated = 'deployment.created',
  DeploymentUpdated = 'deployment.updated',
  DeploymentDeleted = 'deployment.deleted',
  // Wiki Section Events
  WikiSectionDeleted = 'wiki.section.deleted',
  // Project Events
  ProjectCreated = 'project.created',
  ProjectDeleted = 'project.deleted',
  // Project Lane Events
  ProjectLaneDeleted = 'project.lane.deleted',
}
