const resourcePrefix = 'agoracloud';

/**
 * Convert a string to a base64 string
 * @param value the value to convert
 */
function toBase64(value: string): string {
  return Buffer.from(value).toString('base64');
}

/**
 * Generates labels for all Kubernetes resources for an AgoraCloud deployment
 * @param deploymentId the deployment id
 */
function generateDeploymentLabels(
  deploymentId: string,
): {
  [key: string]: string;
} {
  return { app: resourcePrefix, deployment: deploymentId };
}

/**
 * Generates labels for all Kubernetes resources for an AgoraCloud workspace
 * @param workspaceId the workspace id
 */
function generateWorkspaceLabels(
  workspaceId: string,
): {
  [key: string]: string;
} {
  return { app: resourcePrefix, workspace: workspaceId };
}

/**
 * Generates the name for any Kubernetes resource
 * @param id the id of the resource
 */
function generateResourceName(id: string): string {
  return `${resourcePrefix}-${id}`;
}

export {
  resourcePrefix,
  toBase64,
  generateDeploymentLabels,
  generateWorkspaceLabels,
  generateResourceName,
};
