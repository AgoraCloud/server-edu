import { DeploymentImage, DeploymentType } from './schemas/deployment.schema';

export const deploymentImages: DeploymentImage[] = [
  // VSCode Deployments
  { type: DeploymentType.VSCode, version: '3.9.3' },
  { type: DeploymentType.VSCode, version: '3.9.2' },
  { type: DeploymentType.VSCode, version: '3.9.1' },
  { type: DeploymentType.VSCode, version: '3.9.0' },
];
