import { DeploymentDocument } from '../modules/deployments/schemas/deployment.schema';

export class DeploymentCreatedEvent {
  sudoPassword: string;
  deployment: DeploymentDocument;

  constructor(sudoPassword: string, deployment: DeploymentDocument) {
    this.sudoPassword = sudoPassword;
    this.deployment = deployment;
  }
}
