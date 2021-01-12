import { DeploymentDocument } from '../modules/deployments/schemas/deployment.schema';

export class DeploymentDeletedEvent {
  deployment: DeploymentDocument;

  constructor(deployment: DeploymentDocument) {
    this.deployment = deployment;
  }
}
