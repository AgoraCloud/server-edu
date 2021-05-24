import { DeploymentTypeDto } from '@agoracloud/common';
import { DeploymentImage } from './schemas/deployment.schema';

export const deploymentImages: DeploymentImage[] = [
  // VSCode Deployments
  { type: DeploymentTypeDto.VSCode, version: '3.9.3' },
  { type: DeploymentTypeDto.VSCode, version: '3.9.2' },
  { type: DeploymentTypeDto.VSCode, version: '3.9.1' },
  { type: DeploymentTypeDto.VSCode, version: '3.9.0' },
];
