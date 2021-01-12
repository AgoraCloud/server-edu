export enum Event {
  // User Events
  UserCreated = 'user.created',
  ForgotPassword = 'user.forgotPassword',
  PasswordChanged = 'user.passwordChanged',
  // Workspace Events
  WorkspaceDeleted = 'workspace.deleted',
  // Deployment Events
  DeploymentCreated = 'deployment.created',
  DeploymentUpdated = 'deployment.updated',
  DeploymentDeleted = 'deployment.deleted',
}
