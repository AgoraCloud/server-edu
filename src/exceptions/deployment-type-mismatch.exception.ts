import { DeploymentTypeDto } from '@agoracloud/common';
import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a deployment is being updated and the deployment
 * type supplied does not match the deployment type supplied when the deployment
 * was created
 */
export class DeploymentTypeMismatchException extends BadRequestException {
  constructor(
    deploymentId: string,
    deploymentType: DeploymentTypeDto,
    givenDeploymentType: DeploymentTypeDto,
  ) {
    super(
      `Deployment with id ${deploymentId} can not be updated. Deployment type ${givenDeploymentType} does not match the deployments type ${deploymentType}.`,
    );
  }
}
