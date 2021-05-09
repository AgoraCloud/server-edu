import { DeploymentStatus } from '../modules/deployments/schemas/deployment.schema';
import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a user is updating a deployment that
 * is not in the RUNNING or FAILED state
 */
export class DeploymentCannotBeUpdatedException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Deployment with id ${deploymentId} can not be updated. Deployments can be updated only when they are in the ${DeploymentStatus.Running} or ${DeploymentStatus.Failed} state.`,
    );
  }
}
