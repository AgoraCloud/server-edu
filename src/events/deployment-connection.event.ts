/**
 * Payload of the deployment.connection.opened or deployment.connection.closed event
 */
export class DeploymentConnectionEvent {
  kubernetesServiceIp: string;

  constructor(kubernetesServiceIp: string) {
    this.kubernetesServiceIp = kubernetesServiceIp;
  }
}
