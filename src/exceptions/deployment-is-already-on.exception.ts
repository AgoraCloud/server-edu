import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a user tries to turn on a deployment
 * that is already on.
 */
export class DeploymentIsAlreadyOnException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Deployment with id ${deploymentId} can not be turned on. The deployment is already on.`,
    );
  }
}
