import { DeploymentStatus } from '../modules/deployments/schemas/deployment.schema';
import { BadRequestException } from '@nestjs/common';

export class DeploymentCannotBeUpdatedException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Deployment with id ${deploymentId} can not be updated. Deployments can be updated only when they are in the ${DeploymentStatus.Running} or ${DeploymentStatus.Failed} state.`,
    );
  }
}
