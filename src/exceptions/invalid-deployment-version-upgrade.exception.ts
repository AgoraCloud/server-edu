import { DeploymentVersionDto } from '@agoracloud/common';
import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when a deployment is being updated and the version
 * supplied is the same or older than the current deployments version
 */
export class InvalidDeploymentVersionUpgradeException extends BadRequestException {
  constructor(
    deploymentId: string,
    deploymentVersion: DeploymentVersionDto,
    givenDeploymentVersion: DeploymentVersionDto,
  ) {
    super(
      `Deployment with id ${deploymentId} can not be updated. Deployment version ${givenDeploymentVersion} is the same or older than the deployments current version ${deploymentVersion}.`,
    );
  }
}
