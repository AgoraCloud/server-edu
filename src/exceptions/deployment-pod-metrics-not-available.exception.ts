import { BadRequestException } from '@nestjs/common';

/**
 * An exception that is thrown when metrics for a deployments pod are not available
 */
export class DeploymentPodMetricsNotAvailableException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Kubernetes pod metrics for deployment with id ${deploymentId} not available`,
    );
  }
}
