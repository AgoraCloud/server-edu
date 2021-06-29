import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import { generateDeploymentLabels, generateResourceName } from './helpers';
import { KubernetesConfig } from '../../config/configuration.interface';

@Injectable()
export class KubernetesPersistentVolumeClaimsService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
    @Inject('KUBERNETES_CONFIG')
    private readonly kubernetesConfig: KubernetesConfig,
  ) {}

  /**
   * Get all Kubernetes persistent volume claims
   * @param namespace the Kubernetes namespace
   * @returns a list of all Kubernetes persistent volume claims
   */
  getAllPersistentVolumeClaims(namespace: string): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaimList;
  }> {
    return this.k8sCoreV1Api.listNamespacedPersistentVolumeClaim(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Create a Kubernetes persistent volume claim
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param storageCount the persistent volume claim storage size
   * @returns the created Kubernetes persistent volume claim
   */
  createPersistentVolumeClaim(
    namespace: string,
    deploymentId: string,
    storageCount: number,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaim;
  }> {
    return this.k8sCoreV1Api.createNamespacedPersistentVolumeClaim(namespace, {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: generateResourceName(deploymentId),
        labels: generateDeploymentLabels(deploymentId),
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        storageClassName: this.kubernetesConfig.storageClass,
        resources: {
          requests: {
            storage: `${storageCount}Gi`,
          },
        },
      },
    });
  }

  /**
   * Delete a Kubernetes persistent volume claim
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @returns the deleted Kubernetes persistent volume claim
   */
  deletePersistentVolumeClaim(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaim;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedPersistentVolumeClaim(
      generateResourceName(deploymentId),
      namespace,
    );
  }
}
