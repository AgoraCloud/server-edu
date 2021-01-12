import { BadRequestException } from '@nestjs/common';

export class DeploymentPodMetricsNotAvailableException extends BadRequestException {
  constructor(deploymentId: string) {
    super(
      `Kubernetes pod metrics for deployment with id ${deploymentId} not available`,
    );
  }
}
