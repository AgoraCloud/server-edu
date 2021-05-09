import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import { generateWorkspaceLabels } from './helpers';

@Injectable()
export class KubernetesNamespacesService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get all Kubernetes namespaces
   * @returns a list of all Kubernetes namespaces
   */
  getAllNamespaces(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1NamespaceList;
  }> {
    return this.k8sCoreV1Api.listNamespace(
      undefined,
      undefined,
      undefined,
      undefined,
      'workspace',
    );
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
        labels: generateWorkspaceLabels(workspaceId),
      },
    });
  }

  /**
   * Delete a Kubernetes namespace
   * @param name The name of the namespace
   * @returns the deleted Kubernetes namespace
   */
  deleteNamespace(
    name: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespace(name);
  }
}
