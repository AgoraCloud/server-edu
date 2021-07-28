import { KubeUtil } from './utils/kube.util';
import { WorkspaceResources } from '../workspaces/schemas/workspace.schema';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';

@Injectable()
export class KubernetesResourceQuotasService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get a Kubernetes resource quota
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @returns the Kubernetes resource quota
   */
  getResourceQuota(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ResourceQuota;
  }> {
    return this.k8sCoreV1Api.readNamespacedResourceQuota(
      KubeUtil.generateResourceName(workspaceId),
      namespace,
    );
  }

  /**
   * Create a Kubernetes resource quota
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @param workspaceResources the workspace resources
   * @returns the created Kubernetes resource quota
   */
  createResourceQuota(
    namespace: string,
    workspaceId: string,
    workspaceResources: WorkspaceResources,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ResourceQuota;
  }> {
    const hardQuotas: { [key: string]: string } = {};
    if (workspaceResources.cpuCount) {
      hardQuotas['limits.cpu'] = `${workspaceResources.cpuCount}`;
    }
    if (workspaceResources.memoryCount) {
      hardQuotas['limits.memory'] = `${workspaceResources.memoryCount}Gi`;
    }
    if (workspaceResources.storageCount) {
      hardQuotas['requests.storage'] = `${workspaceResources.storageCount}Gi`;
    }
    return this.k8sCoreV1Api.createNamespacedResourceQuota(namespace, {
      apiVersion: 'v1',
      kind: 'ResourceQuota',
      metadata: {
        name: KubeUtil.generateResourceName(workspaceId),
        labels: {
          app: KubeUtil.resourcePrefix,
        },
      },
      spec: {
        hard: hardQuotas,
      },
    });
  }

  /**
   * Update a Kubernetes resource quota
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @param workspaceResources the workspace resources
   * @returns the updated Kubernetes resource quota
   */
  updateResourceQuota(
    namespace: string,
    workspaceId: string,
    workspaceResources: WorkspaceResources,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ResourceQuota;
  }> {
    const hardQuotas: { [key: string]: string } = {};
    if (workspaceResources.cpuCount) {
      hardQuotas['limits.cpu'] = `${workspaceResources.cpuCount}`;
    }
    if (workspaceResources.memoryCount) {
      hardQuotas['limits.memory'] = `${workspaceResources.memoryCount}Gi`;
    }
    if (workspaceResources.storageCount) {
      hardQuotas['requests.storage'] = `${workspaceResources.storageCount}Gi`;
    }
    const name: string = KubeUtil.generateResourceName(workspaceId);
    return this.k8sCoreV1Api.replaceNamespacedResourceQuota(name, namespace, {
      apiVersion: 'v1',
      kind: 'ResourceQuota',
      metadata: {
        name: name,
        labels: {
          app: KubeUtil.resourcePrefix,
        },
      },
      spec: {
        hard: hardQuotas,
      },
    });
  }

  /**
   * Delete a Kubernetes resource quota
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @returns the deleted Kubernetes resource quota
   */
  deleteResourceQuota(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ResourceQuota;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedResourceQuota(
      KubeUtil.generateResourceName(workspaceId),
      namespace,
    );
  }
}
