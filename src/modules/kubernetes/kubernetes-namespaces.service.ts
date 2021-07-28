import { KubeUtil } from './utils/kube.util';
import { InDatabaseConfigService } from './../in-database-config/in-database-config.service';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';

@Injectable()
export class KubernetesNamespacesService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
    private readonly inDatabaseConfigService: InDatabaseConfigService,
  ) {}

  /**
   * Get all Kubernetes namespaces
   * @returns a list of all Kubernetes namespaces
   */
  async getAllNamespaces(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1NamespaceList;
  }> {
    const namespaces: {
      response: http.IncomingMessage;
      body: k8s.V1NamespaceList;
    } = await this.k8sCoreV1Api.listNamespace(
      undefined,
      undefined,
      undefined,
      undefined,
      'workspace',
    );
    namespaces.body.items = namespaces.body.items.filter(
      (n) =>
        n.metadata?.labels?.instance == this.inDatabaseConfigService.instanceId,
    );
    return namespaces;
  }

  /**
   * Create a Kubernetes namespace
   * @param name the name of the namespace
   * @param workspaceId the workspace id
   * @returns the created Kubernetes namespace
   */
  createNamespace(
    name: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Namespace;
  }> {
    return this.k8sCoreV1Api.createNamespace({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name,
        labels: {
          ...KubeUtil.generateWorkspaceLabels(workspaceId),
          instance: this.inDatabaseConfigService.instanceId,
        },
      },
    });
  }

  /**
   * Delete a Kubernetes namespace
   * @param name The name of the namespace
   * @returns the deleted Kubernetes namespace
   */
  deleteNamespace(name: string): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespace(name);
  }
}
