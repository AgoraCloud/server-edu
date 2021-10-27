import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a user tries to turn off a deployment
 * that is already off.
 */
export class DeploymentIsAlreadyOffException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Deployment with id ${deploymentId} can not be turned off. The deployment is already off.`,
    );
  }
}
