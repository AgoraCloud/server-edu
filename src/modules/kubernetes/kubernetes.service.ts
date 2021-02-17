import { KubernetesPodsService } from './kubernetes-pods.service';
import { KubernetesDeploymentsService } from './kubernetes-deployments.service';
import { KubernetesServicesService } from './kubernetes-services.service';
import { KubernetesPersistentVolumeClaimsService } from './kubernetes-persistent-volume-claims.service';
import { KubernetesSecretsService } from './kubernetes-secrets.service';
import { KubernetesResourceQuotasService } from './kubernetes-resource-quotas.service';
import { KubernetesRolesService } from './kubernetes-roles.service';
import { KubernetesNetworkPoliciesService } from './kubernetes-network-policies.service';
import { KubernetesNamespacesService } from './kubernetes-namespaces.service';
import { WorkspaceMetricsNotAvailableException } from './../../exceptions/workspace-metrics-not-available.exception';
import { WorkspaceUpdatedEvent } from './../../events/workspace-updated.event';
import { DeploymentDocument } from './../deployments/schemas/deployment.schema';
import { WorkspaceNamespace } from './schemas/workspace-namespace.schema';
import {
  WorkspaceDocument,
  WorkspaceResources,
} from './../workspaces/schemas/workspace.schema';
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
import { MetricsDto } from './dto/metrics.dto';
import { DeploymentStatus } from '../deployments/schemas/deployment.schema';
import { DeploymentDeletedEvent } from '../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from '../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from '../../events/deployment-created.event';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../events/events.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { generateResourceName } from './helpers';

@Injectable()
export class KubernetesService implements OnModuleInit {
  private readonly logger: Logger = new Logger(KubernetesService.name);

  constructor(
    @Inject(k8s.KubeConfig) private readonly kc: k8s.KubeConfig,
    private readonly namespacesService: KubernetesNamespacesService,
    private readonly networkPoliciesService: KubernetesNetworkPoliciesService,
    private readonly rolesService: KubernetesRolesService,
    private readonly resourceQuotasService: KubernetesResourceQuotasService,
    private readonly secretsService: KubernetesSecretsService,
    private readonly persistentVolumeClaimsService: KubernetesPersistentVolumeClaimsService,
    private readonly servicesService: KubernetesServicesService,
    private readonly kubeDeploymentsService: KubernetesDeploymentsService,
    private readonly podsService: KubernetesPodsService,
    private readonly deploymentsService: DeploymentsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.startPodInformer();
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
    const informer: k8s.Informer<k8s.V1Pod> = k8s.makeInformer(
      this.kc,
      `/api/v1/namespaces/${namespace}/pods`,
      this.podsService.makeNamespacedPodListFunction(namespace),
    );
    informer.on('update', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    informer.on('error', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    await informer.start();
  }

  /**
   * Get a Workspaces metrics (through the workspaces namespace resource quota)
   * @param workspace the workspace
   */
  async getWorkspaceMetrics(workspace: WorkspaceDocument): Promise<MetricsDto> {
    const workspaceId: string = workspace._id;
    const workspaceResources: WorkspaceResources =
      workspace.properties?.resources;
    if (
      !workspaceResources ||
      (!workspaceResources.cpuCount &&
        !workspaceResources.memoryCount &&
        !workspaceResources.storageCount)
    ) {
      throw new WorkspaceMetricsNotAvailableException(workspaceId);
    }
    try {
      const {
        body: resourceQuota,
      } = await this.resourceQuotasService.getResourceQuota(
        generateResourceName(workspaceId),
        workspaceId,
      );
      const workspaceMetrics: MetricsDto = new MetricsDto(
        resourceQuota.status?.used['limits.cpu'],
        resourceQuota.status?.used['limits.memory'],
        resourceQuota.status?.used['requests.storage'],
      );
      return workspaceMetrics;
    } catch (err) {
      throw new WorkspaceMetricsNotAvailableException(workspaceId);
    }
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
    const workspaceResources: WorkspaceResources =
      payload.workspace.properties?.resources;
    const namespace: string = generateResourceName(workspaceId);
    try {
      await this.namespacesService.createNamespace(namespace, workspaceId);
      await this.networkPoliciesService.createNetworkPolicy(
        namespace,
        workspaceId,
      );
      await this.rolesService.createRole(namespace, workspaceId);
      await this.rolesService.createRoleBinding(namespace, workspaceId);
      if (
        workspaceResources &&
        (workspaceResources.cpuCount ||
          workspaceResources.memoryCount ||
          workspaceResources.storageCount)
      ) {
        await this.resourceQuotasService.createResourceQuota(
          namespace,
          workspaceId,
          workspaceResources,
        );
      }
      await this.startNamespacedPodInformer(namespace);
    } catch (error) {
      // TODO: handle errors
      this.logger.error({
        error: `Error creating a namespace for workspace ${workspaceId}`,
        failureReason: error.response?.body?.message,
      });
    }
  }

  /**
   * Handles the workspace.updated event
   * @param payload the workspace.updated event payload
   */
  @OnEvent(Event.WorkspaceUpdated)
  private async handleWorkspaceUpdatedEvent(
    payload: WorkspaceUpdatedEvent,
  ): Promise<void> {
    const workspaceId: string = payload.workspace._id;
    const namespace: string = generateResourceName(workspaceId);
    const workspaceResources: WorkspaceResources =
      payload.workspace.properties?.resources;
    // Check if a resource quota for the workspaces namespace exists
    let resourceQuotaExists = true;
    try {
      await this.resourceQuotasService.getResourceQuota(namespace, workspaceId);
    } catch (err) {
      // The resource quota does not exist, set the flag
      resourceQuotaExists = false;
    }
    try {
      if (!workspaceResources) return;
      if (
        workspaceResources.cpuCount ||
        workspaceResources.memoryCount ||
        workspaceResources.storageCount
      ) {
        if (resourceQuotaExists) {
          await this.resourceQuotasService.updateResourceQuota(
            namespace,
            workspaceId,
            workspaceResources,
          );
        } else {
          await this.resourceQuotasService.createResourceQuota(
            namespace,
            workspaceId,
            workspaceResources,
          );
        }
      } else if (resourceQuotaExists) {
        await this.resourceQuotasService.deleteResourceQuota(
          namespace,
          workspaceId,
        );
      }
    } catch (error) {
      // TODO: handle errors
      this.logger.error({
        error: `Error updating the resource quota for workspace ${workspaceId}`,
        failureReason: error.response?.body?.message,
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
      const namespace: string = generateResourceName(payload.id);
      await this.namespacesService.deleteNamespace(namespace);
    } catch (err) {
      // Do nothing, this will get picked up by the
      // deleteRemainingKubernetesNamespacesJob scheduler
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
    const namespace: string = generateResourceName(
      payload.deployment.workspace._id,
    );
    const deploymentId: string = payload.deployment._id;
    const storageCount = payload.deployment.properties.resources.storageCount;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatus.Creating,
    );

    try {
      await this.secretsService.createSecret(
        namespace,
        deploymentId,
        payload.sudoPassword,
      );
      await this.servicesService.createService(namespace, deploymentId);
      if (storageCount) {
        await this.persistentVolumeClaimsService.createPersistentVolumeClaim(
          namespace,
          deploymentId,
          storageCount,
        );
      }
      await this.kubeDeploymentsService.createDeployment(
        namespace,
        deploymentId,
        payload.deployment.properties,
      );
    } catch (error) {
      // TODO: retry creation based on the creation failure reason
      const failureReason: string = error.response?.body?.message;
      this.logger.error({
        error: `Error creating deployment ${deploymentId}`,
        failureReason,
      });
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Failed,
        failureReason,
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
    const namespace: string = generateResourceName(payload.workspaceId);
    const deploymentId: string = payload.deploymentId;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatus.Updating,
    );
    try {
      await this.kubeDeploymentsService.updateDeployment(
        namespace,
        deploymentId,
        payload.updateDeploymentDto.properties.resources,
      );
    } catch (error) {
      // TODO: roll back the deployment update
      const failureReason: string = error.response?.body?.message;
      this.logger.error({
        error: `Error updating deployment ${deploymentId}`,
        failureReason,
      });
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatus.Failed,
        failureReason,
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
    const namespace: string = generateResourceName(
      payload.deployment.workspace._id,
    );
    const deploymentId: string = payload.deployment._id;
    try {
      await this.servicesService.deleteService(namespace, deploymentId);
      await this.kubeDeploymentsService.deleteDeployment(
        namespace,
        deploymentId,
      );
      if (payload.deployment.properties.resources.storageCount) {
        await this.persistentVolumeClaimsService.deletePersistentVolumeClaim(
          namespace,
          deploymentId,
        );
      }
      await this.secretsService.deleteSecret(namespace, deploymentId);
    } catch (error) {
      this.logger.error({
        error: `Error deleting deployment ${deploymentId}`,
        failureReason: error.response?.body?.message,
      });
    }
  }

  /**
   * Cron job that runs every hour and deletes any Kubernetes
   * namespace that was not deleted when a workspace was deleted
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteRemainingKubernetesNamespacesJob(): Promise<void> {
    const {
      body: { items: namespaces },
    } = await this.namespacesService.getAllNamespaces();
    const workspaceNamespaces: WorkspaceNamespace[] = await this.getAllWorkspaceNamespaces();
    for (const namespace of namespaces) {
      const namespaceName: string = namespace.metadata?.name;
      if (
        workspaceNamespaces.findIndex((w) => w.namespace === namespaceName) ===
        -1
      ) {
        await this.namespacesService.deleteNamespace(namespaceName);
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
      } = await this.servicesService.getAllServices(namespace);
      const {
        body: { items: deployments },
      } = await this.kubeDeploymentsService.getAllDeployments(namespace);
      const {
        body: { items: persistentVolumeClaims },
      } = await this.persistentVolumeClaimsService.getAllPersistentVolumeClaims(
        namespace,
      );
      const {
        body: { items: secrets },
      } = await this.secretsService.getAllSecrets(namespace);
      for (const service of services) {
        const deploymentId: string = service?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.servicesService.deleteService(namespace, deploymentId);
        }
      }
      for (const deployment of deployments) {
        const deploymentId: string = deployment?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.kubeDeploymentsService.deleteDeployment(
            namespace,
            deploymentId,
          );
        }
      }
      for (const persistentVolumeClaim of persistentVolumeClaims) {
        const deploymentId: string =
          persistentVolumeClaim?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.persistentVolumeClaimsService.deletePersistentVolumeClaim(
            namespace,
            deploymentId,
          );
        }
      }
      for (const secret of secrets) {
        const deploymentId: string = secret?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.secretsService.deleteSecret(namespace, deploymentId);
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
      } = await this.podsService.getAllPods(workspaceNamespace.namespace);
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
      (w) => new WorkspaceNamespace(w._id, generateResourceName(w._id)),
    );
  }
}
