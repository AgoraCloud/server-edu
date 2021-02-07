export enum Event {
  // User Events
  UserCreated = 'user.created',
  UserDeleted = 'user.deleted',
  ForgotPassword = 'user.forgotPassword',
  PasswordChanged = 'user.passwordChanged',
  // Workspace Events
  WorkspaceCreated = 'workspace.created',
  WorkspaceUserRemoved = 'workspace.user.removed',
  WorkspaceDeleted = 'workspace.deleted',
  // Deployment Events
  DeploymentCreated = 'deployment.created',
  DeploymentUpdated = 'deployment.updated',
  DeploymentDeleted = 'deployment.deleted',
}
