import { UpdateDeploymentDto } from './../modules/deployments/dto/update-deployment.dto';

export class DeploymentUpdatedEvent {
  deploymentId: string;
  updateDeploymentDto: UpdateDeploymentDto;

  constructor(deploymentId: string, updateDeploymentDto: UpdateDeploymentDto) {
    this.deploymentId = deploymentId;
    this.updateDeploymentDto = updateDeploymentDto;
  }
}
