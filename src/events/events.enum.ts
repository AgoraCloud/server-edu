export enum Event {
  // User Events
  UserCreated = 'user.created',
  UserDeleted = 'user.deleted',
  ForgotPassword = 'user.forgotPassword',
  PasswordChanged = 'user.passwordChanged',
  // Workspace Events
  WorkspaceCreated = 'workspace.created',
  WorkspaceUpdated = 'workspace.updated',
  WorkspaceUserRemoved = 'workspace.user.removed',
  WorkspaceDeleted = 'workspace.deleted',
  // Deployment Events
  DeploymentCreated = 'deployment.created',
  DeploymentUpdated = 'deployment.updated',
  DeploymentDeleted = 'deployment.deleted',
  // Wiki Section Events
  WikiSectionDeleted = 'wiki.section.deleted',
  // Project Events
  ProjectDeleted = 'project.deleted',
}
