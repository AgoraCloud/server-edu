import { KubeUtil } from './utils/kube.util';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import { DeploymentTypeDto } from '@agoracloud/common';
import { DEPLOYMENT_CONFIG } from './config/deployment.config';

@Injectable()
export class KubernetesServicesService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get all Kubernetes services
   * @param namespace the Kubernetes namespace
   * @returns a list of all Kubernetes services
   */
  getAllServices(namespace: string): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ServiceList;
  }> {
    return this.k8sCoreV1Api.listNamespacedService(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      KubeUtil.resourcePrefixLabelSelector,
    );
  }

  /**
   * Create a Kubernetes service
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @returns the created Kubernetes service
   */
  createService(
    namespace: string,
    deploymentId: string,
    deploymentType: DeploymentTypeDto,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Service;
  }> {
    const labels: { [key: string]: string } =
      KubeUtil.generateDeploymentLabels(deploymentId);
    return this.k8sCoreV1Api.createNamespacedService(namespace, {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: KubeUtil.generateResourceName(deploymentId),
        labels,
      },
      spec: {
        type: 'ClusterIP',
        ports: [
          {
            port: 80,
            targetPort: new Number(
              DEPLOYMENT_CONFIG[deploymentType].containerPort,
            ),
          },
        ],
        selector: labels,
      },
    });
  }

  /**
   * Delete a Kubernetes service
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @returns the deleted Kubernetes service
   */
  deleteService(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedService(
      KubeUtil.generateResourceName(deploymentId),
      namespace,
    );
  }
}
