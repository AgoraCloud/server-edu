import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { WorkspaceNamespace } from './schemas/workspace-namespace.schema';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { WorkspacesService } from './../workspaces/workspaces.service';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { WorkspaceCreatedEvent } from './../../events/workspace-created.event';
import {
  PodConditionType,
  PodConditionReason,
  PodConditionStatus,
} from './schemas/pod-condition.schema';
import { PodPhase } from './schemas/pod-phase.schema';
import { DeploymentsService } from '../deployments/deployments.service';
import { UpdateDeploymentResourcesDto } from '../deployments/dto/update-deployment.dto';
import { DeploymentPodMetricsNotAvailableException } from '../../exceptions/deployment-pod-metrics-not-available.exception';
import { DeploymentMetricsDto } from './dto/deployment-metrics.dto';
import { DeploymentPodNotAvailableException } from '../../exceptions/deployment-pod-not-available.exception';
import {
  DeploymentProperties,
  DeploymentStatus,
} from '../deployments/schemas/deployment.schema';
import { KubernetesConfig } from '../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { DeploymentDeletedEvent } from '../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from '../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from '../../events/deployment-created.event';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../events/events.enum';
import * as http from 'http';
import * as request from 'request';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KubernetesService {
  private readonly k8sCoreV1Api: k8s.CoreV1Api;
  private readonly k8sAppsV1Api: k8s.AppsV1Api;
  private readonly k8sNetworkingV1Api: k8s.NetworkingV1Api;
  private readonly k8sRbacAuthorizationV1Api: k8s.RbacAuthorizationV1Api;
  private readonly kubernetesConfig: KubernetesConfig;
  private readonly resourcePrefix: string = 'agoracloud';
  private readonly logger = new Logger(KubernetesService.name);

  constructor(
    @Inject(k8s.KubeConfig) private readonly kc: k8s.KubeConfig,
    private readonly configService: ConfigService,
    private readonly deploymentsService: DeploymentsService,
    private readonly workspacesService: WorkspacesService,
  ) {
    this.kubernetesConfig = this.configService.get<KubernetesConfig>(
      'kubernetes',
    );
    this.kc.loadFromDefault();
    this.k8sCoreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
    this.k8sAppsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    this.k8sNetworkingV1Api = this.kc.makeApiClient(k8s.NetworkingV1Api);
    this.k8sRbacAuthorizationV1Api = this.kc.makeApiClient(
      k8s.RbacAuthorizationV1Api,
    );
    this.startPodInformer();
  }

  /**
   * Get all Kubernetes namespaces
   */
  private getAllNamespaces(): Promise<{
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
   */
  private createNamespace(
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
        labels: this.generateWorkspaceLabels(workspaceId),
      },
    });
  }

  /**
   * Delete a Kubernetes namespace
   * @param name The name of the namespace
   */
  private deleteNamespace(
    name: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespace(name);
  }

  /**
   * Create a Kubernetes network policy
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   */
  private createNetworkPolicy(
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
        name: this.generateResourceName(workspaceId),
        labels: this.generateWorkspaceLabels(workspaceId),
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
                    app: this.resourcePrefix,
                  },
                },
                podSelector: {
                  matchLabels: {
                    app: `${this.resourcePrefix}-server`,
                  },
                },
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * Create a Kubernetes role
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   */
  private createRole(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Role;
  }> {
    return this.k8sRbacAuthorizationV1Api.createNamespacedRole(namespace, {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: this.generateResourceName(workspaceId),
        labels: this.generateWorkspaceLabels(workspaceId),
      },
      rules: [
        {
          apiGroups: [''],
          resources: [
            'pods',
            'pods/log',
            'services',
            'secrets',
            'persistentvolumeclaims',
          ],
          verbs: ['*'],
        },
        {
          apiGroups: ['apps'],
          resources: ['deployments'],
          verbs: ['*'],
        },
        {
          apiGroups: ['metrics.k8s.io'],
          resources: ['pods'],
          verbs: ['get', 'list'],
        },
      ],
    });
  }

  /**
   * Create a Kubernetes role binding
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   */
  private createRoleBinding(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1RoleBinding;
  }> {
    const name: string = this.generateResourceName(workspaceId);
    return this.k8sRbacAuthorizationV1Api.createNamespacedRoleBinding(
      namespace,
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'RoleBinding',
        metadata: {
          name,
          labels: this.generateWorkspaceLabels(workspaceId),
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Role',
          name,
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: this.kubernetesConfig.serviceAccount,
            namespace: this.kubernetesConfig.namespace,
          },
        ],
      },
    );
  }

  /**
   * Get all Kubernetes secrets
   * @param namespace the Kubernetes namespace
   */
  private getAllSecrets(
    namespace: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1SecretList;
  }> {
    return this.k8sCoreV1Api.listNamespacedSecret(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Create a Kubernetes secret
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param sudoPassword the deployment container sudo password
   */
  private createSecret(
    namespace: string,
    deploymentId: string,
    sudoPassword: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Secret;
  }> {
    return this.k8sCoreV1Api.createNamespacedSecret(namespace, {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: this.generateResourceName(deploymentId),
        labels: this.generateDeploymentLabels(deploymentId),
      },
      data: {
        sudo_password: this.toBase64(sudoPassword),
      },
    });
  }

  /**
   * Delete a Kubernetes secret
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   */
  private deleteSecret(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedSecret(
      this.generateResourceName(deploymentId),
      namespace,
    );
  }

  /**
   * Get all Kubernetes persistent volume claims
   * @param namespace the Kubernetes namespace
   */
  private getAllPersistentVolumeClaims(
    namespace: string,
  ): Promise<{
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
   */
  private createPersistentVolumeClaim(
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
        name: this.generateResourceName(deploymentId),
        labels: this.generateDeploymentLabels(deploymentId),
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
   */
  private deletePersistentVolumeClaim(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PersistentVolumeClaim;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedPersistentVolumeClaim(
      this.generateResourceName(deploymentId),
      namespace,
    );
  }

  /**
   * Get all Kubernetes services
   * @param namespace the Kubernetes namespace
   */
  private getAllServices(
    namespace: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1ServiceList;
  }> {
    return this.k8sCoreV1Api.listNamespacedService(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Create a Kubernetes service
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   */
  private createService(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Service;
  }> {
    const labels: { [key: string]: string } = this.generateDeploymentLabels(
      deploymentId,
    );
    return this.k8sCoreV1Api.createNamespacedService(namespace, {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: this.generateResourceName(deploymentId),
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
    });
  }

  /**
   * Delete a Kubernetes service
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   */
  private deleteService(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedService(
      this.generateResourceName(deploymentId),
      namespace,
    );
  }

  /**
   * Get all Kubernetes deployments
   * @param namespace the Kubernetes namespace
   */
  private getAllDeployments(
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
  private createDeployment(
    namespace: string,
    deploymentId: string,
    deploymentProperties: DeploymentProperties,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Deployment;
  }> {
    const labels: { [key: string]: string } = this.generateDeploymentLabels(
      deploymentId,
    );
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
  private updateDeployment(
    namespace: string,
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
  private deleteDeployment(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sAppsV1Api.deleteNamespacedDeployment(
      this.generateResourceName(deploymentId),
      namespace,
    );
  }

  /**
   * Get all Kubernetes pods
   * @param namespace the Kubernetes namespace
   */
  private async getAllPods(
    namespace: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1PodList;
  }> {
    return this.k8sCoreV1Api.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Get a Kubernetes pod
   * @param namespace the Kubernetes namespace
   * @param deploymentId the pods deployment id
   */
  private async getPod(
    namespace: string,
    deploymentId: string,
  ): Promise<k8s.V1Pod> {
    // Get all pods
    const {
      body: { items: pods },
    } = await this.getAllPods(namespace);
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
   * @param workspaceId the pods workspace id
   * @param deploymentId the pods deployment id
   */
  async getPodLogs(workspaceId: string, deploymentId: string): Promise<string> {
    const namespace: string = this.generateResourceName(workspaceId);
    const pod: k8s.V1Pod = await this.getPod(namespace, deploymentId);
    const { body } = await this.k8sCoreV1Api.readNamespacedPodLog(
      pod.metadata.name,
      namespace,
    );
    return body;
  }

  /**
   * Get a Kubernetes pod metrics
   * @param workspaceId the pods workspace id
   * @param deploymentId the pods deployment id
   */
  async getPodMetrics(
    workspaceId: string,
    deploymentId: string,
  ): Promise<DeploymentMetricsDto> {
    const namespace: string = this.generateResourceName(workspaceId);
    const pod: k8s.V1Pod = await this.getPod(namespace, deploymentId);
    const opts: request.Options = {
      url: '',
    };
    await this.kc.applyToRequest(opts);
    const response: any = await new Promise((resolve, reject) => {
      request.get(
        `${
          this.kc.getCurrentCluster().server
        }/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods/${
          pod.metadata.name
        }`,
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
   * Handles the workspace.created event
   * @param payload the workspace.created event payload
   */
  @OnEvent(Event.WorkspaceCreated)
  private async handleWorkspaceCreatedEvent(
    payload: WorkspaceCreatedEvent,
  ): Promise<void> {
    const workspaceId: string = payload.workspace._id;
    const namespace: string = this.generateResourceName(workspaceId);
    try {
      await this.createNamespace(namespace, workspaceId);
      await this.createNetworkPolicy(namespace, workspaceId);
      await this.createRole(namespace, workspaceId);
      await this.createRoleBinding(namespace, workspaceId);
      await this.startNamespacedPodInformer(namespace);
    } catch (error) {
      // TODO: handle errors
      this.logger.error({
        message: `Error creating a namespace for workspace ${workspaceId}`,
        error,
      });
    }
  }

  /**
   * Handles the workspace.deleted event
   * @param payload the workspace.deleted event payload
   */
  @OnEvent(Event.WorkspaceDeleted)
  private async handleWorkspaceDeletedEvent(
    payload: WorkspaceDeletedEvent,
  ): Promise<void> {
    try {
      const namespace: string = this.generateResourceName(payload.id);
      await this.deleteNamespace(namespace);
    } catch (err) {
      // TODO: do nothing, this will get picked up by the scheduler
    }
  }

  /**
   * Handles the deployment.created event
   * @param payload the deployment.created event payload
   */
  @OnEvent(Event.DeploymentCreated)
  private async handleDeploymentCreatedEvent(
    payload: DeploymentCreatedEvent,
  ): Promise<void> {
    const namespace: string = this.generateResourceName(
      payload.deployment.workspace._id,
    );
    const deploymentId: string = payload.deployment._id;
    const storageCount = payload.deployment.properties.resources.storageCount;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatus.Creating,
    );

    try {
      await this.createSecret(namespace, deploymentId, payload.sudoPassword);
      await this.createService(namespace, deploymentId);
      if (storageCount) {
        await this.createPersistentVolumeClaim(
          namespace,
          deploymentId,
          storageCount,
        );
      }
      await this.createDeployment(
        namespace,
        deploymentId,
        payload.deployment.properties,
      );
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
    const namespace: string = this.generateResourceName(payload.workspaceId);
    const deploymentId: string = payload.deploymentId;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatus.Updating,
    );
    try {
      await this.updateDeployment(
        namespace,
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
    const namespace: string = this.generateResourceName(
      payload.deployment.workspace._id,
    );
    const deploymentId: string = payload.deployment._id;
    try {
      await this.deleteService(namespace, deploymentId);
      await this.deleteDeployment(namespace, deploymentId);
      if (payload.deployment.properties.resources.storageCount) {
        await this.deletePersistentVolumeClaim(namespace, deploymentId);
      }
      await this.deleteSecret(namespace, deploymentId);
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
   * Set up and start the Kubernetes pod informer for all namespaces
   */
  private async startPodInformer(): Promise<void> {
    const workspaceNamespaces: WorkspaceNamespace[] = await this.getAllWorkspaceNamespaces();
    for (const workspaceNamespace of workspaceNamespaces) {
      await this.startNamespacedPodInformer(workspaceNamespace.namespace);
    }
  }

  /**
   * Set up and start the Kubernetes pod informer for a specific namespace
   * @param namespace the Kubernetes namespace
   */
  private async startNamespacedPodInformer(namespace: string): Promise<void> {
    const listFn = (): Promise<{
      response: http.IncomingMessage;
      body: k8s.V1PodList;
    }> => this.k8sCoreV1Api.listNamespacedPod(namespace);
    const informer: k8s.Informer<k8s.V1Pod> = k8s.makeInformer(
      this.kc,
      `/api/v1/namespaces/${namespace}/pods`,
      listFn,
    );
    informer.on('update', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    informer.on('error', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    await informer.start();
  }

  /**
   * Generates labels for all Kubernetes resources for an AgoraCloud deployment
   * @param deploymentId the deployment id
   */
  private generateDeploymentLabels(
    deploymentId: string,
  ): {
    [key: string]: string;
  } {
    return { app: this.resourcePrefix, deployment: deploymentId };
  }

  /**
   * Generates labels for all Kubernetes resources for an AgoraCloud workspace
   * @param workspaceId the workspace id
   */
  private generateWorkspaceLabels(
    workspaceId: string,
  ): {
    [key: string]: string;
  } {
    return { app: this.resourcePrefix, workspace: workspaceId };
  }

  /**
   * Generates the name for any Kubernetes resource
   * @param id the id of the resource
   */
  private generateResourceName(id: string): string {
    return `${this.resourcePrefix}-${id}`;
  }

  /**
   * Cron job that runs every hour and deletes any Kubernetes
   * namespace that was not deleted when a workspace was deleted
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteRemainingKubernetesNamespacesJob(): Promise<void> {
    const {
      body: { items: namespaces },
    } = await this.getAllNamespaces();
    const workspaceNamespaces: WorkspaceNamespace[] = await this.getAllWorkspaceNamespaces();
    for (const namespace of namespaces) {
      const namespaceName: string = namespace.metadata?.name;
      if (
        workspaceNamespaces.findIndex((w) => w.namespace === namespaceName) ===
        -1
      ) {
        await this.deleteNamespace(namespaceName);
      }
    }
  }

  /**
   * Cron job that runs every hour and deletes any Kubernetes
   * resource that was not deleted when a deployment was
   * deleted
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteRemainingKubernetesResourcesJob(): Promise<void> {
    const workspaceNamespaces: WorkspaceNamespace[] = await this.getAllWorkspaceNamespaces();
    for (const workspaceNamespace of workspaceNamespaces) {
      const namespace: string = workspaceNamespace.namespace;
      const storedDeployments: DeploymentDocument[] = await this.deploymentsService.findAll(
        workspaceNamespace.workspaceId,
      );
      const storedDeploymentIds: string[] = storedDeployments.map((d) =>
        d._id.toString(),
      );
      const {
        body: { items: services },
      } = await this.getAllServices(namespace);
      const {
        body: { items: deployments },
      } = await this.getAllDeployments(namespace);
      const {
        body: { items: persistentVolumeClaims },
      } = await this.getAllPersistentVolumeClaims(namespace);
      const {
        body: { items: secrets },
      } = await this.getAllSecrets(namespace);
      for (const service of services) {
        const deploymentId: string = service?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.deleteService(namespace, deploymentId);
        }
      }
      for (const deployment of deployments) {
        const deploymentId: string = deployment?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.deleteDeployment(namespace, deploymentId);
        }
      }
      for (const persistentVolumeClaim of persistentVolumeClaims) {
        const deploymentId: string =
          persistentVolumeClaim?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.deletePersistentVolumeClaim(namespace, deploymentId);
        }
      }
      for (const secret of secrets) {
        const deploymentId: string = secret?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.deleteSecret(namespace, deploymentId);
        }
      }
    }
  }

  /**
   * Cron job that runs every minute and updates a deployments
   * status based on the Kubernetes pod status
   */
  @Cron(CronExpression.EVERY_MINUTE)
  private async updateDeploymentStatusesJob(): Promise<void> {
    const workspaceNamespaces: WorkspaceNamespace[] = await this.getAllWorkspaceNamespaces();
    for (const workspaceNamespace of workspaceNamespaces) {
      const {
        body: { items: pods },
      } = await this.getAllPods(workspaceNamespace.namespace);
      for (const pod of pods) {
        await this.updateDeploymentStatus(pod);
      }
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

  /**
   * Get all workspace namespaces
   */
  private async getAllWorkspaceNamespaces(): Promise<WorkspaceNamespace[]> {
    const workspaces: WorkspaceDocument[] = await this.workspacesService.findAll();
    return workspaces.map(
      (w) => new WorkspaceNamespace(w._id, this.generateResourceName(w._id)),
    );
  }
}
