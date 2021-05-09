import { InternalServerErrorException } from '@nestjs/common';

/**
 * An exception that is thrown when a deployments pod is not available yet
 */
export class DeploymentPodNotAvailableException extends InternalServerErrorException {
  constructor(deploymentId: string) {
    super(
      `Kubernetes pod for deployment with id ${deploymentId} not available`,
    );
  }
}
