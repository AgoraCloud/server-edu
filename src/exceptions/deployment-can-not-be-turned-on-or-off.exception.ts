import { DeploymentScalingMethodDto } from '@agoracloud/common';
import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a user tries to turn on or turn off a deployment
 * that does not have the ON_DEMAND scaling method.
 */
export class DeploymentCanNotBeTurnedOnOrOffException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Deployment with id ${deploymentId} can not be turned on or off. The deployment needs to have the ${DeploymentScalingMethodDto.OnDemand} scaling method.`,
    );
  }
}
