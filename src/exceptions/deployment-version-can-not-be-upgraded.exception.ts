import { DeploymentTypeDto } from '@agoracloud/common';
import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a deployment is being updated, the version
 * supplied is different than the current deployments version and the deployment type
 * does not support version upgrades. For example, versions of deployments with type
 * UBUNTU can not be upgraded.
 */
export class DeploymentVersionCanNotBeUpgradedException extends BadRequestException {
  constructor(deploymentId: string, deploymentType: DeploymentTypeDto) {
    super(
      `Deployment with id ${deploymentId} can not be updated. Versions of deployments with type ${deploymentType} can not be upgraded.`,
    );
  }
}
