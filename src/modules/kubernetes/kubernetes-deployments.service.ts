import { KubeUtil } from './utils/kube.util';
import { DeploymentImage } from './../deployments/schemas/deployment.schema';
import { DeploymentProperties } from '../deployments/schemas/deployment.schema';
import {
  DeploymentTypeDto,
  UpdateDeploymentPropertiesDto,
  UpdateDeploymentResourcesDto,
} from '@agoracloud/common';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';
import { ContainerConfig, DEPLOYMENT_CONFIG } from './config/deployment.config';

@Injectable()
export class KubernetesDeploymentsService {
  constructor(
    @Inject(k8s.AppsV1Api) private readonly k8sAppsV1Api: k8s.AppsV1Api,
  ) {}

  /**
   * Get all Kubernetes deployments
   * @param namespace the Kubernetes namespace
   * @returns a list of all Kubernetes deployments
   */
  getAllDeployments(namespace: string): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1DeploymentList;
  }> {
    return this.k8sAppsV1Api.listNamespacedDeployment(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      KubeUtil.resourcePrefixLabelSelector,
    );
  }

  /**
   * Create a Kubernetes deployment
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param deploymentProperties the deployment properties
   * @returns the created Kubernetes deployment
   */
  createDeployment(
    namespace: string,
    deploymentId: string,
    deploymentProperties: DeploymentProperties,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const labels: { [key: string]: string } =
      KubeUtil.generateDeploymentLabels(deploymentId);
    const resourceName: string = KubeUtil.generateResourceName(deploymentId);
    const containerConfig: ContainerConfig =
      DEPLOYMENT_CONFIG[deploymentProperties.image.type];

    // Deployment volumes and volume mounts
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
        mountPath: containerConfig.volumeMountPath,
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
                image: this.generateContainerImage(deploymentProperties.image),
                imagePullPolicy: 'IfNotPresent',
                resources: {
                  limits: {
                    memory: `${deploymentProperties.resources.memoryCount}Gi`,
                    cpu: `${deploymentProperties.resources.cpuCount}`,
                  },
                },
                env: [
                  {
                    name: containerConfig.passwordEnvVariable,
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
                    port: new Number(containerConfig.containerPort),
                  },
                  initialDelaySeconds: 3,
                  periodSeconds: 3,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/',
                    port: new Number(containerConfig.containerPort),
                  },
                  initialDelaySeconds: 3,
                  periodSeconds: 3,
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
   * @returns the updated Kubernetes deployment
   */
  updateDeployment(
    namespace: string,
    deploymentId: string,
    updatedProperties: UpdateDeploymentPropertiesDto,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const resourceName: string = KubeUtil.generateResourceName(deploymentId);

    const resources: k8s.V1ResourceRequirements = {
      limits: {},
    };
    const updatedResources: UpdateDeploymentResourcesDto =
      updatedProperties.resources;
    if (updatedResources?.cpuCount) {
      resources.limits.cpu = `${updatedResources.cpuCount}`;
    }
    if (updatedResources?.memoryCount) {
      resources.limits.memory = `${updatedResources.memoryCount}Gi`;
    }

    const updatedContainer: k8s.V1Container = {
      name: resourceName,
      resources,
    };
    if (updatedProperties.image) {
      updatedContainer.image = this.generateContainerImage(
        updatedProperties.image,
      );
    }

    return this.k8sAppsV1Api.patchNamespacedDeployment(
      resourceName,
      namespace,
      {
        spec: {
          template: {
            spec: {
              containers: [updatedContainer],
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
   * @returns the deleted Kubernetes deployment
   */
  deleteDeployment(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sAppsV1Api.deleteNamespacedDeployment(
      KubeUtil.generateResourceName(deploymentId),
      namespace,
    );
  }

  /**
   * Generates a container image from the given deployment type and version
   * @param deploymentImage the deployment image to convert
   * @returns the generated container image
   */
  private generateContainerImage(deploymentImage: DeploymentImage): string {
    if (deploymentImage.type === DeploymentTypeDto.VSCode) {
      return `linuxserver/code-server:version-v${deploymentImage.version}`;
    } else if (deploymentImage.type === DeploymentTypeDto.Ubuntu) {
      return `linuxserver/webtop:ubuntu-mate-version-${deploymentImage.version}`;
    }
  }
}
