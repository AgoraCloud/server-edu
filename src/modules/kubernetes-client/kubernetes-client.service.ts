import {
  PodConditionType,
  PodConditionReason,
  PodConditionStatus,
} from './schemas/pod-condition.schema';
import { PodPhase } from './schemas/pod-phase.schema';
import { DeploymentsService } from './../deployments/deployments.service';
import { UpdateDeploymentResourcesDto } from './../deployments/dto/update-deployment.dto';
import { DeploymentPodMetricsNotAvailableException } from '../../exceptions/deployment-pod-metrics-not-available.exception';
import { DeploymentMetricsDto } from './dto/deployment-metrics.dto';
import { DeploymentPodNotAvailableException } from '../../exceptions/deployment-pod-not-available.exception';
import {
  DeploymentDocument,
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
import { Cron, CronExpression } from '@nestjs/schedule';

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
   * Get all Kubernetes secrets
   */
  private getAllSecrets(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1SecretList;
  }> {
    return this.k8sCoreV1Api.listNamespacedSecret(
      this.kubernetesConfig.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
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
          name: this.generateResourceName(deploymentId),
          namespace: this.kubernetesConfig.namespace,
          labels: this.generateLabels(deploymentId),
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
      this.generateResourceName(deploymentId),
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Get all Kubernetes persistent volume claims
   */
  private getAllPersistentVolumeClaims(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaimList;
  }> {
    return this.k8sCoreV1Api.listNamespacedPersistentVolumeClaim(
      this.kubernetesConfig.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
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
          name: this.generateResourceName(deploymentId),
          namespace: this.kubernetesConfig.namespace,
          labels: this.generateLabels(deploymentId),
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
      this.generateResourceName(deploymentId),
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Get all Kubernetes services
   */
  private getAllServices(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ServiceList;
  }> {
    return this.k8sCoreV1Api.listNamespacedService(
      this.kubernetesConfig.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
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
    const labels: { [key: string]: string } = this.generateLabels(deploymentId);
    return this.k8sCoreV1Api.createNamespacedService(
      this.kubernetesConfig.namespace,
      {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: this.generateResourceName(deploymentId),
          namespace: this.kubernetesConfig.namespace,
          labels,
        },
        spec: {
          type: 'ClusterIP',
          ports: [
            {
              port: 80,
              targetPort: new Number(8443),
            },
          ],
          selector: labels,
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
      this.generateResourceName(deploymentId),
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Get all Kubernetes deployments
   */
  private getAllDeployments(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1DeploymentList;
  }> {
    return this.k8sAppsV1Api.listNamespacedDeployment(
      this.kubernetesConfig.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
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
    const labels: { [key: string]: string } = this.generateLabels(deploymentId);
    const resourceName: string = this.generateResourceName(deploymentId);
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

    return this.k8sAppsV1Api.createNamespacedDeployment(
      this.kubernetesConfig.namespace,
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: resourceName,
          namespace: this.kubernetesConfig.namespace,
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
    const resourceName: string = this.generateResourceName(deploymentId);
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
      this.kubernetesConfig.namespace,
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
   * @param deploymentId the deployment id
   */
  private deleteDeployment(
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sAppsV1Api.deleteNamespacedDeployment(
      this.generateResourceName(deploymentId),
      this.kubernetesConfig.namespace,
    );
  }

  /**
   * Get all Kubernetes pods
   */
  private async getAllPods(): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PodList;
  }> {
    return this.k8sCoreV1Api.listNamespacedPod(
      this.kubernetesConfig.namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Get a Kubernetes pod
   * @param deploymentId the pods deployment id
   */
  private async getPod(deploymentId: string): Promise<k8s.V1Pod> {
    // Get all pods
    const {
      body: { items: pods },
    } = await this.getAllPods();
    // Filter the pods by the deployment label
    const podIndex: number = pods.findIndex(
      (p) =>
        p.metadata?.labels?.deployment === deploymentId && p.metadata?.name,
    );
    if (podIndex === -1) {
      throw new DeploymentPodNotAvailableException(deploymentId);
    }
    return pods[podIndex];
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
    const containers: any[] = response.containers as any[];
    const containerIndex: number = containers.findIndex(
      (c) => c.name === this.generateResourceName(deploymentId),
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
    informer.on('update', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    informer.on('error', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    await informer.start();
  }

  /**
   * Generates labels for all Kubernetes resources
   * @param deploymentId the deployment id
   */
  private generateLabels(
    deploymentId: string,
  ): {
    [key: string]: string;
  } {
    return { app: this.resourcePrefix, deployment: deploymentId };
  }

  /**
   * Generates the name for any Kubernetes resource
   * @param deploymentId the deployment id
   */
  private generateResourceName(deploymentId: string): string {
    return `${this.resourcePrefix}-${deploymentId}`;
  }

  /**
   * Cron job that runs every hour and deletes any Kubernetes
   * resource that was not deleted when a deployment was
   * deleted
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteRemainingKubernetesResourcesJob(): Promise<void> {
    const storedDeployments: DeploymentDocument[] = await this.deploymentsService.findAll();
    const storedDeploymentIds: string[] = storedDeployments.map((d) =>
      d._id.toString(),
    );
    const {
      body: { items: services },
    } = await this.getAllServices();
    const {
      body: { items: deployments },
    } = await this.getAllDeployments();
    const {
      body: { items: persistentVolumeClaims },
    } = await this.getAllPersistentVolumeClaims();
    const {
      body: { items: secrets },
    } = await this.getAllSecrets();
    for (const service of services) {
      const deploymentId: string = service?.metadata?.labels?.deployment;
      if (!storedDeploymentIds.includes(deploymentId)) {
        await this.deleteService(deploymentId);
      }
    }
    for (const deployment of deployments) {
      const deploymentId: string = deployment?.metadata?.labels?.deployment;
      if (!storedDeploymentIds.includes(deploymentId)) {
        await this.deleteDeployment(deploymentId);
      }
    }
    for (const persistentVolumeClaim of persistentVolumeClaims) {
      const deploymentId: string =
        persistentVolumeClaim?.metadata?.labels?.deployment;
      if (!storedDeploymentIds.includes(deploymentId)) {
        await this.deletePersistentVolumeClaim(deploymentId);
      }
    }
    for (const secret of secrets) {
      const deploymentId: string = secret?.metadata?.labels?.deployment;
      if (!storedDeploymentIds.includes(deploymentId)) {
        await this.deleteSecret(deploymentId);
      }
    }
  }

  /**
   * Cron job that runs every minute and updates a deployments
   * status based on the Kubernetes pod status
   */
  @Cron(CronExpression.EVERY_MINUTE)
  private async updateDeploymentStatusesJob(): Promise<void> {
    const {
      body: { items: pods },
    } = await this.getAllPods();
    for (const pod of pods) {
      await this.updateDeploymentStatus(pod);
    }
  }

  /**
   * Updates a deployments status based on the Kubernetes
   * pod status
   * @param pod the deployments Kubernetes pod
   */
  private async updateDeploymentStatus(pod: k8s.V1Pod): Promise<void> {
    const deploymentId: string = pod.metadata?.labels?.deployment;
    if (!deploymentId) return;
    const podPhase: string = pod.status?.phase;

    if (!podPhase || podPhase === PodPhase.Unknown) {
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Unknown,
      );
    } else if (podPhase === PodPhase.Running) {
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Running,
      );
    } else if (podPhase === PodPhase.Pending) {
      /**
       * Check if the pod can not be scheduled by Kubernetes due
       * to insufficient cluster resources
       */
      const conditions: k8s.V1PodCondition[] = pod.status?.conditions;
      const podScheduledConditionIndex: number = conditions?.findIndex(
        (c) =>
          c.type === PodConditionType.PodScheduled &&
          c.status === PodConditionStatus.False &&
          c.reason === PodConditionReason.Unschedulable,
      );
      if (podScheduledConditionIndex !== -1) {
        await this.deploymentsService.updateStatus(
          deploymentId,
          DeploymentStatus.Failed,
          conditions[podScheduledConditionIndex].message,
        );
      }
    } else if (podPhase === PodPhase.Failed) {
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Failed,
      );
    }
  }
}
