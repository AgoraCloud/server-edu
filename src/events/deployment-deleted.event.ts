import { DeploymentDocument } from '../modules/deployments/schemas/deployment.schema';

/**
 * Payload of the deployment.deleted event
 */
export class DeploymentDeletedEvent {
  deployment: DeploymentDocument;

  constructor(deployment: DeploymentDocument) {
    this.deployment = deployment;
  }
}
