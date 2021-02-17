import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import {
  generateDeploymentLabels,
  generateResourceName,
  toBase64,
} from './helpers';

@Injectable()
export class KubernetesSecretsService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get all Kubernetes secrets
   * @param namespace the Kubernetes namespace
   */
  getAllSecrets(
    namespace: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1SecretList;
  }> {
    return this.k8sCoreV1Api.listNamespacedSecret(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Create a Kubernetes secret
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param sudoPassword the deployment container sudo password
   */
  createSecret(
    namespace: string,
    deploymentId: string,
    sudoPassword: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Secret;
  }> {
    return this.k8sCoreV1Api.createNamespacedSecret(namespace, {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: generateResourceName(deploymentId),
        labels: generateDeploymentLabels(deploymentId),
      },
      data: {
        sudo_password: toBase64(sudoPassword),
      },
    });
  }

  /**
   * Delete a Kubernetes secret
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   */
  deleteSecret(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedSecret(
      generateResourceName(deploymentId),
      namespace,
    );
  }
}
