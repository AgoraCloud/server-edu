import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import {
  generateResourceName,
  generateWorkspaceLabels,
  resourcePrefix,
} from './helpers';

@Injectable()
export class KubernetesNetworkPoliciesService {
  constructor(
    @Inject(k8s.NetworkingV1Api)
    private readonly k8sNetworkingV1Api: k8s.NetworkingV1Api,
  ) {}

  /**
   * Create a Kubernetes network policy
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @returns the created Kubernetes network policy
   */
  createNetworkPolicy(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1NetworkPolicy;
  }> {
    return this.k8sNetworkingV1Api.createNamespacedNetworkPolicy(namespace, {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      metadata: {
        name: generateResourceName(workspaceId),
        labels: generateWorkspaceLabels(workspaceId),
      },
      spec: {
        // Select all the pods in the namespace
        podSelector: {},
        policyTypes: ['Ingress'],
        ingress: [
          {
            // Allow ingress from the agoracloud-server container only
            from: [
              {
                namespaceSelector: {
                  matchLabels: {
                    app: resourcePrefix,
                  },
                },
                podSelector: {
                  matchLabels: {
                    app: `${resourcePrefix}-server`,
                  },
                },
              },
            ],
          },
        ],
      },
    });
  }
}
