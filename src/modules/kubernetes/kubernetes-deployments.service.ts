import { DeploymentProperties } from '../deployments/schemas/deployment.schema';
import { UpdateDeploymentResourcesDto } from '../deployments/dto/update-deployment.dto';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import { generateDeploymentLabels, generateResourceName } from './helpers';

@Injectable()
export class KubernetesDeploymentsService {
  constructor(
    @Inject(k8s.AppsV1Api) private readonly k8sAppsV1Api: k8s.AppsV1Api,
  ) {}

  /**
   * Get all Kubernetes deployments
   * @param namespace the Kubernetes namespace
   */
  getAllDeployments(
    namespace: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1DeploymentList;
  }> {
    return this.k8sAppsV1Api.listNamespacedDeployment(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Create a Kubernetes deployment
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param deploymentProperties the deployment properties
   */
  createDeployment(
    namespace: string,
    deploymentId: string,
    deploymentProperties: DeploymentProperties,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const labels: { [key: string]: string } = generateDeploymentLabels(
      deploymentId,
    );
    const resourceName: string = generateResourceName(deploymentId);
    const volumes: k8s.V1Volume[] = [];
    const volumeMounts: k8s.V1VolumeMount[] = [];
    if (deploymentProperties.resources.storageCount) {
      volumes.push({
        name: resourceName,
        persistentVolumeClaim: {
          claimName: resourceName,
        },
      });
      volumeMounts.push({
        name: resourceName,
        mountPath: '/config',
      });
    }

    return this.k8sAppsV1Api.createNamespacedDeployment(namespace, {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: resourceName,
        labels,
      },
      spec: {
        replicas: 1,
        strategy: {
          type: 'Recreate',
        },
        selector: {
          matchLabels: labels,
        },
        template: {
          metadata: {
            labels,
          },
          spec: {
            volumes,
            containers: [
              {
                name: resourceName,
                image: `${deploymentProperties.image.name}:${deploymentProperties.image.tag}`,
                imagePullPolicy: 'Always',
                resources: {
                  limits: {
                    memory: `${deploymentProperties.resources.memoryCount}Gi`,
                    cpu: `${deploymentProperties.resources.cpuCount}`,
                  },
                },
                env: [
                  {
                    name: 'SUDO_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        name: resourceName,
                        key: 'sudo_password',
                      },
                    },
                  },
                ],
                volumeMounts,
                livenessProbe: {
                  httpGet: {
                    path: '/',
                    port: new Number(8443),
                  },
                },
                readinessProbe: {
                  httpGet: {
                    path: '/',
                    port: new Number(8443),
                  },
                },
              },
            ],
          },
        },
      },
    });
  }

  /**
   * Update a Kubernetes deployment
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param updatedResources the updated deployment resources
   */
  updateDeployment(
    namespace: string,
    deploymentId: string,
    updatedResources: UpdateDeploymentResourcesDto,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const resourceName: string = generateResourceName(deploymentId);
    const resources: k8s.V1ResourceRequirements = new k8s.V1ResourceRequirements();
    resources.limits = {};
    if (updatedResources.cpuCount) {
      resources.limits.cpu = `${updatedResources.cpuCount}`;
    }
    if (updatedResources.memoryCount) {
      resources.limits.memory = `${updatedResources.memoryCount}Gi`;
    }

    return this.k8sAppsV1Api.patchNamespacedDeployment(
      resourceName,
      namespace,
      {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: resourceName,
                  resources,
                },
              ],
            },
          },
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      {
        headers: {
          'Content-type': k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH,
        },
      },
    );
  }

  /**
   * Delete a Kubernetes deployment
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   */
  deleteDeployment(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sAppsV1Api.deleteNamespacedDeployment(
      generateResourceName(deploymentId),
      namespace,
    );
  }
}
