import { DeploymentDocument } from '../modules/deployments/schemas/deployment.schema';

/**
 * Payload of the deployment.created event
 */
export class DeploymentCreatedEvent {
  sudoPassword: string;
  deployment: DeploymentDocument;

  constructor(sudoPassword: string, deployment: DeploymentDocument) {
    this.sudoPassword = sudoPassword;
    this.deployment = deployment;
  }
}
