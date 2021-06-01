import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a deployment is not in the
 * RUNNING state
 */
export class DeploymentNotRunningException extends BadRequestException {
  constructor(deploymentId: string) {
    super(`Deployment with id ${deploymentId} is not in the RUNNING state`);
  }
}
