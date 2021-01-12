import { BadRequestException } from '@nestjs/common';

export class DeploymentNotRunningException extends BadRequestException {
  constructor(deploymentId: string) {
    super(`Deployment with id ${deploymentId} is not in the RUNNING state`);
  }
}
