import { DeploymentsService } from './../deployments/deployments.service';
import { UpdateDeploymentResourcesDto } from './../deployments/dto/update-deployment.dto';
import { DeploymentPodMetricsNotAvailableException } from '../../exceptions/deployment-pod-metrics-not-available.exception';
import { DeploymentMetricsDto } from './dto/deployment-metrics.dto';
import { DeploymentPodNotAvailableException } from '../../exceptions/deployment-pod-not-available.exception';
import {
  DeploymentProperties,
  DeploymentStatus,
} from './../deployments/schemas/deployment.schema';
import { KubernetesConfig } from './../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { DeploymentDeletedEvent } from './../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from './../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from './../../events/deployment-created.event';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../events/events.enum';
import * as http from 'http';
import * as request from 'request';

@Injectable()
export class KubernetesClientService {
  private readonly k8sCoreV1Api: k8s.CoreV1Api;
  private readonly k8sAppsV1Api: k8s.AppsV1Api;
  private readonly kubernetesConfig: KubernetesConfig;
  private readonly resourcePrefix: string = 'agoracloud';
  // TODO: remove after debugging is done
  private readonly logger = new Logger(KubernetesClientService.name);

  constructor(
    @Inject(k8s.KubeConfig) private readonly kc: k8s.KubeConfig,
    private readonly configService: ConfigService,
    private readonly deploymentsService: DeploymentsService,
  ) {
    this.kubernetesConfig = this.configService.get<KubernetesConfig>(
      'kubernetes',
    );
    this.kc.loadFromDefault();
    this.k8sCoreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.k8sAppsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    this.startPodInformer();
  }

  /**
   * Create a Kubernetes secret
   * @param deploymentId the deployment id
   * @param sudoPassword the deployment container sudo password
   */
  private createSecret(
    deploymentId: string,
    sudoPassword: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Secret;
  }> {
    return this.k8sCoreV1Api.createNamespacedSecret(
      this.kubernetesConfig.namespace,
      {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          name: `${this.resourcePrefix}-${deploymentId}`,
          namespace: this.kubernetesConfig.namespace,
          labels: {
            app: this.resourcePrefix,
            deployment: deploymentId,
          },
        },
        data: {
          sudo_password: this.toBase64(sudoPassword),
        },
      },
    );
  }

  /**
   * Delete a Kubernetes secret
   * @param deploymentId the deployment id
   */
  private deleteSecret(
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedSecret(
      `${this.resourcePrefix}-${deploymentId}`,
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Create a Kubernetes persistent volume claim
   * @param deploymentId the deployment id
   * @param storageCount the persistent volume claim storage size
   */
  private createPersistentVolumeClaim(
    deploymentId: string,
    storageCount: number,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaim;
  }> {
    return this.k8sCoreV1Api.createNamespacedPersistentVolumeClaim(
      this.kubernetesConfig.namespace,
      {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: `${this.resourcePrefix}-${deploymentId}`,
          namespace: this.kubernetesConfig.namespace,
          labels: {
            app: this.resourcePrefix,
            deployment: deploymentId,
          },
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
      },
    );
  }

  /**
   * Delete a Kubernetes persistent volume claim
   * @param deploymentId the deployment id
   */
  private deletePersistentVolumeClaim(
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaim;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedPersistentVolumeClaim(
      `${this.resourcePrefix}-${deploymentId}`,
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Create a Kubernetes service
   * @param deploymentId the deployment id
   */
  private createService(
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Service;
  }> {
    return this.k8sCoreV1Api.createNamespacedService(
      this.kubernetesConfig.namespace,
      {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: `${this.resourcePrefix}-${deploymentId}`,
          namespace: this.kubernetesConfig.namespace,
          labels: {
            app: this.resourcePrefix,
            deployment: deploymentId,
          },
        },
        spec: {
          type: 'ClusterIP',
          ports: [
            {
              port: 80,
              targetPort: new Number(8443),
            },
          ],
          selector: {
            app: this.resourcePrefix,
            deployment: deploymentId,
          },
        },
      },
    );
  }

  /**
   * Delete a Kubernetes service
   * @param deploymentId the deployment id
   */
  private deleteService(
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedService(
      `${this.resourcePrefix}-${deploymentId}`,
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Create a Kubernetes deployment
   * @param deploymentId the deployment id
   * @param deploymentProperties the deployment properties
   */
  private createDeployment(
    deploymentId: string,
    deploymentProperties: DeploymentProperties,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const volumes: k8s.V1Volume[] = [];
    const volumeMounts: k8s.V1VolumeMount[] = [];
    if (deploymentProperties.resources.storageCount) {
      volumes.push({
        name: `${this.resourcePrefix}-${deploymentId}`,
        persistentVolumeClaim: {
          claimName: `${this.resourcePrefix}-${deploymentId}`,
        },
      });
      volumeMounts.push({
        name: `${this.resourcePrefix}-${deploymentId}`,
        mountPath: '/config',
      });
    }

    return this.k8sAppsV1Api.createNamespacedDeployment(
      this.kubernetesConfig.namespace,
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: `${this.resourcePrefix}-${deploymentId}`,
          namespace: this.kubernetesConfig.namespace,
          labels: {
            app: this.resourcePrefix,
            deployment: deploymentId,
          },
        },
        spec: {
          replicas: 1,
          strategy: {
            type: 'Recreate',
          },
          selector: {
            matchLabels: {
              app: this.resourcePrefix,
              deployment: deploymentId,
            },
          },
          template: {
            metadata: {
              labels: {
                app: this.resourcePrefix,
                deployment: deploymentId,
              },
            },
            spec: {
              volumes,
              containers: [
                {
                  name: `${this.resourcePrefix}-${deploymentId}`,
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
                          name: `${this.resourcePrefix}-${deploymentId}`,
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
      },
    );
  }

  /**
   * Update a Kubernetes deployment
   * @param deploymentId the deployment id
   * @param updatedResources the updated deployment resources
   */
  private updateDeployment(
    deploymentId: string,
    updatedResources: UpdateDeploymentResourcesDto,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const resources: k8s.V1ResourceRequirements = new k8s.V1ResourceRequirements();
    resources.limits = {};
    if (updatedResources.cpuCount) {
      resources.limits.cpu = `${updatedResources.cpuCount}`;
    }
    if (updatedResources.memoryCount) {
      resources.limits.memory = `${updatedResources.memoryCount}Gi`;
    }

    return this.k8sAppsV1Api.patchNamespacedDeployment(
      `${this.resourcePrefix}-${deploymentId}`,
      this.kubernetesConfig.namespace,
      {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: `${this.resourcePrefix}-${deploymentId}`,
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
   * @param deploymentId the deployment id
   */
  private deleteDeployment(
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sAppsV1Api.deleteNamespacedDeployment(
      `${this.resourcePrefix}-${deploymentId}`,
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Get a Kubernetes pod
   * @param deploymentId the pods deployment id
   */
  private async getPod(deploymentId: string): Promise<k8s.V1Pod> {
    // Get all the pods
    const { body } = await this.k8sCoreV1Api.listNamespacedPod(
      this.kubernetesConfig.namespace,
    );
    // Filter the pods by the deployment label
    const podIndex: number = body.items.findIndex(
      (p) =>
        p.metadata?.labels?.deployment === deploymentId && p.metadata?.name,
    );
    if (podIndex === -1) {
      throw new DeploymentPodNotAvailableException(deploymentId);
    }
    return body.items[podIndex];
  }

  /**
   * Get a Kubernetes pod logs
   * @param deploymentId the pods deployment id
   */
  async getPodLogs(deploymentId: string): Promise<string> {
    const pod: k8s.V1Pod = await this.getPod(deploymentId);
    const { body } = await this.k8sCoreV1Api.readNamespacedPodLog(
      pod.metadata.name,
      this.kubernetesConfig.namespace,
    );
    return body;
  }

  /**
   * Get a Kubernetes pod metrics
   * @param deploymentId the pods deployment id
   */
  async getPodMetrics(deploymentId: string): Promise<DeploymentMetricsDto> {
    const pod: k8s.V1Pod = await this.getPod(deploymentId);
    const opts: request.Options = {
      url: '',
    };
    await this.kc.applyToRequest(opts);
    const response: any = await new Promise((resolve, reject) => {
      request.get(
        `${
          this.kc.getCurrentCluster().server
        }/apis/metrics.k8s.io/v1beta1/namespaces/${
          this.kubernetesConfig.namespace
        }/pods/${pod.metadata.name}`,
        opts,
        (error, response, body) => {
          if (error) reject(error);
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        },
      );
    });

    // Validate the response
    if (!Array.isArray(response?.containers)) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    const containers = response.containers as any[];
    const containerIndex = containers.findIndex(
      (c) => c.name === `${this.resourcePrefix}-${deploymentId}`,
    );
    if (containerIndex === -1) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    const containerMetrics: DeploymentMetricsDto =
      containers[containerIndex].usage;
    if (!containerMetrics?.cpu && !containerMetrics?.memory) {
      throw new DeploymentPodMetricsNotAvailableException(deploymentId);
    }
    return containerMetrics;
  }

  /**
   * Handles the deployment.created event
   * @param payload the deployment.created event payload
   */
  @OnEvent(Event.DeploymentCreated)
  private async handleDeploymentCreatedEvent(
    payload: DeploymentCreatedEvent,
  ): Promise<void> {
    const deploymentId: string = payload.deployment._id;
    const storageCount = payload.deployment.properties.resources.storageCount;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatus.Creating,
    );

    try {
      await this.createSecret(deploymentId, payload.sudoPassword);
      await this.createService(deploymentId);
      if (storageCount) {
        await this.createPersistentVolumeClaim(deploymentId, storageCount);
      }
      await this.createDeployment(deploymentId, payload.deployment.properties);
    } catch (error) {
      // TODO: add a message to the deployment to indicate failure reason
      // TODO: retry creation based on the creation failure reason
      this.logger.error({
        message: `Error creating deployment ${deploymentId}`,
        error,
      });
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Failed,
      );
    }
  }

  /**
   * Handles the deployment.updated event
   * @param payload the deployment.updated event payload
   */
  @OnEvent(Event.DeploymentUpdated)
  private async handleDeploymentUpdatedEvent(
    payload: DeploymentUpdatedEvent,
  ): Promise<void> {
    const deploymentId: string = payload.deploymentId;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatus.Updating,
    );
    try {
      await this.updateDeployment(
        deploymentId,
        payload.updateDeploymentDto.properties.resources,
      );
    } catch (error) {
      // TODO: roll back the deployment update
      this.logger.error({
        message: `Error updating deployment ${deploymentId}`,
        error,
      });
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Failed,
      );
    }
  }

  /**
   * Handles the deployment.deleted event
   * @param payload the deployment.deleted event payload
   */
  @OnEvent(Event.DeploymentDeleted)
  private async handleDeploymentDeletedEvent(
    payload: DeploymentDeletedEvent,
  ): Promise<void> {
    const deploymentId: string = payload.deployment._id;
    try {
      await this.deleteService(deploymentId);
      await this.deleteDeployment(deploymentId);
      if (payload.deployment.properties.resources.storageCount) {
        await this.deletePersistentVolumeClaim(deploymentId);
      }
      await this.deleteSecret(deploymentId);
    } catch (error) {
      // TODO: handle deletion failure
      this.logger.error({
        message: `Error deleting deployment ${deploymentId}`,
        error,
      });
    }
  }

  /**
   * Convert a string to a base64 string
   * @param value the value to convert
   */
  private toBase64(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  /**
   * Set up and start the Kubernetes pod informer
   */
  private async startPodInformer(): Promise<void> {
    const listFn = (): Promise<{
      response: http.IncomingMessage;
      body: k8s.V1PodList;
    }> => this.k8sCoreV1Api.listNamespacedPod(this.kubernetesConfig.namespace);
    const informer: k8s.Informer<k8s.V1Pod> = k8s.makeInformer(
      this.kc,
      `/api/v1/namespaces/${this.kubernetesConfig.namespace}/pods`,
      listFn,
    );
    informer.on('add', (obj: k8s.V1Pod) => this.onPodAdded(obj));
    informer.on('update', (obj: k8s.V1Pod) => this.onPodUpdated(obj));
    informer.on('delete', (obj: k8s.V1Pod) => this.onPodDeleted(obj));
    informer.on('error', (err: k8s.V1Pod) => this.onPodError(err));
    await informer.start();
  }

  /**
   * TODO: see if needed
   */
  private onPodAdded(obj: k8s.V1Pod): void {
    this.logger.debug(`POD Added: ${obj.metadata?.name}`);
  }

  /**
   * Checks a pods conditions to make sure it is ready to accept
   * connections. The deployments status is updated to RUNNING
   * if all conditions are fulfilled.
   * @param obj the Kubernetes pod
   */
  private onPodUpdated(obj: k8s.V1Pod): void {
    const deploymentId: string = obj?.metadata?.labels?.deployment;
    // Check pod conditions
    const conditions: k8s.V1PodCondition[] = obj.status?.conditions;
    const podScheduled: boolean = this.isConditionFulfilled(
      conditions,
      'PodScheduled',
    );
    const containersReady: boolean = this.isConditionFulfilled(
      conditions,
      'ContainersReady',
    );
    const initialized: boolean = this.isConditionFulfilled(
      conditions,
      'Initialized',
    );
    const ready: boolean = this.isConditionFulfilled(conditions, 'Ready');

    if (
      deploymentId &&
      podScheduled &&
      containersReady &&
      initialized &&
      ready
    ) {
      this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Running,
      );
    }
  }

  /**
   * TODO: see if needed
   */
  private onPodDeleted(obj: k8s.V1Pod): void {
    this.logger.debug(
      `POD Deleted: ${obj.metadata?.name}, ${obj.metadata?.labels}`,
    );
  }

  /**
   * TODO: see if needed
   */
  private onPodError(err: k8s.V1Pod): void {
    this.logger.error(`POD Error: ${err}`);
  }

  /**
   * Checks whether a pod condition has been fulfilled
   * @param conditions the pods conditions
   * @param condition the condition to check
   */
  private isConditionFulfilled(
    conditions: k8s.V1PodCondition[],
    condition: 'PodScheduled' | 'ContainersReady' | 'Initialized' | 'Ready',
  ): boolean {
    return (
      conditions?.findIndex(
        (c) => c.type === condition && c.status === 'True',
      ) !== -1
    );
  }
}
