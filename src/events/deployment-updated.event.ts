import { UpdateDeploymentDto } from '@agoracloud/common';

/**
 * Payload of the deployment.updated event
 */
export class DeploymentUpdatedEvent {
  workspaceId: string;
  deploymentId: string;
  updateDeploymentDto: UpdateDeploymentDto;

  constructor(
    workspaceId: string,
    deploymentId: string,
    updateDeploymentDto: UpdateDeploymentDto,
  ) {
    this.workspaceId = workspaceId;
    this.deploymentId = deploymentId;
    this.updateDeploymentDto = updateDeploymentDto;
  }
}
