import { DeploymentStatusDto } from '@agoracloud/common';
import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a user is updating a deployment that
 * is not in the RUNNING or FAILED state
 */
export class DeploymentCannotBeUpdatedException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Deployment with id ${deploymentId} can not be updated. Deployments can be updated only when they are in the ${DeploymentStatusDto.Running} or ${DeploymentStatusDto.Failed} state.`,
    );
  }
}
