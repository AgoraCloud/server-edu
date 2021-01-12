import { InternalServerErrorException } from '@nestjs/common';

export class DeploymentPodNotAvailableException extends InternalServerErrorException {
  constructor(deploymentId: string) {
    super(
      `Kubernetes pod for deployment with id ${deploymentId} not available`,
    );
  }
}
