import { DeploymentIsAlreadyOffException } from '../../exceptions/deployment-is-already-off.exception';
import { DeploymentIsAlreadyOnException } from '../../exceptions/deployment-is-already-on.exception';
import { DeploymentCanNotBeTurnedOnOrOffException } from './../../exceptions/deployment-can-not-be-turned-on-or-off.exception';
import { DeploymentConnectionEvent } from './../../events/deployment-connection.event';
import { KubeUtil } from './utils/kube.util';
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
import {
  DeploymentScalingMethodDto,
  DeploymentStatusDto,
  MetricsDto,
} from '@agoracloud/common';
import { DeploymentDeletedEvent } from '../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from '../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from '../../events/deployment-created.event';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../events/events.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeletedKubernetesResourcesCount } from './schemas/delete-kubernetes-resources-count.type';
import { sleep } from '../../utils/sleep.util';

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
    await this.startNamespacedPodInformers();
  }

  /**
   * Set up and start the Kubernetes pod informer for all namespaces
   */
  private async startNamespacedPodInformers(): Promise<void> {
    const workspaceNamespaces: WorkspaceNamespace[] =
      await this.getAllWorkspaceNamespaces();
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
    informer.on('add', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    informer.on('update', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    informer.on('error', (pod: k8s.V1Pod) => this.updateDeploymentStatus(pod));
    await informer.start();
  }

  /**
   * Get a Workspaces metrics (through the workspaces namespace resource quota)
   * @param workspace the workspace
   * @throws WorkspaceMetricsNotAvailableException
   * @returns the workspace metrics
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
      const { body: resourceQuota } =
        await this.resourceQuotasService.getResourceQuota(
          KubeUtil.generateResourceName(workspaceId),
          workspaceId,
        );
      const workspaceMetrics: MetricsDto = new MetricsDto({
        cpu: KubeUtil.toPercentage(
          resourceQuota.status?.used['limits.cpu'],
          workspace.properties?.resources?.cpuCount,
        ),
        memory: KubeUtil.toPercentage(
          resourceQuota.status?.used['limits.memory'],
          workspace.properties?.resources?.memoryCount,
        ),
        storage: KubeUtil.toPercentage(
          resourceQuota.status?.used['requests.storage'],
          workspace.properties?.resources?.storageCount,
        ),
      });
      return workspaceMetrics;
    } catch (error) {
      throw new WorkspaceMetricsNotAvailableException(workspaceId);
    }
  }

  /**
   * Turn on a deployment (scale up the deployments Kubernetes deployment
   * replica count to 1)
   * @param workspaceId the workspace id
   * @param deployment the deployment
   * @throws DeploymentCanNotBeTurnedOnOrOffException
   * @throws DeploymentIsAlreadyOnException
   */
  async turnOnDeployment(
    workspaceId: string,
    deployment: DeploymentDocument,
  ): Promise<void> {
    if (
      deployment.properties.scalingMethod ===
      DeploymentScalingMethodDto.AlwaysOn
    ) {
      throw new DeploymentCanNotBeTurnedOnOrOffException(deployment._id);
    }
    if (deployment.status === DeploymentStatusDto.Running) {
      throw new DeploymentIsAlreadyOnException(deployment._id);
    }
    await this.deploymentsService.updateStatus(
      deployment._id,
      DeploymentStatusDto.Pending,
    );
    await this.deploymentsService.updateUsageStatus(deployment._id, false);
    await this.kubeDeploymentsService.updateDeploymentReplicaCount(
      KubeUtil.generateResourceName(workspaceId),
      deployment._id,
      1,
    );
  }

  /**
   * Turn off a deployment (scale down the deployments Kubernetes
   * deployment replica count to 0)
   * @param workspaceId
   * @param deployment
   */
  async turnOffDeployment(
    workspaceId: string,
    deployment: DeploymentDocument,
  ): Promise<void> {
    if (
      deployment.properties.scalingMethod ===
      DeploymentScalingMethodDto.AlwaysOn
    ) {
      throw new DeploymentCanNotBeTurnedOnOrOffException(deployment._id);
    }
    if (deployment.status === DeploymentStatusDto.Stopped) {
      throw new DeploymentIsAlreadyOffException(deployment._id);
    }
    await this.deploymentsService.updateStatus(
      deployment._id,
      DeploymentStatusDto.Stopped,
    );
    await this.deploymentsService.updateUsageStatus(deployment._id, false);
    await this.kubeDeploymentsService.updateDeploymentReplicaCount(
      KubeUtil.generateResourceName(workspaceId),
      deployment._id,
      0,
    );
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
    const namespace: string = KubeUtil.generateResourceName(workspaceId);
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
    const namespace: string = KubeUtil.generateResourceName(workspaceId);
    const workspaceResources: WorkspaceResources =
      payload.workspace.properties?.resources;
    // Check if a resource quota for the workspaces namespace exists
    let resourceQuotaExists = true;
    try {
      await this.resourceQuotasService.getResourceQuota(namespace, workspaceId);
    } catch (error) {
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
      const namespace: string = KubeUtil.generateResourceName(payload.id);
      await this.namespacesService.deleteNamespace(namespace);
    } catch (error) {
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
    /**
     * Sleep for 2 seconds to make sure that all the Kubernetes resources needed for
     * the deployments workspace have been created when a workstation is created
     */
    await sleep(2000);
    const namespace: string = KubeUtil.generateResourceName(
      payload.deployment.workspace._id,
    );
    const deploymentId: string = payload.deployment._id;
    const storageCount = payload.deployment.properties.resources.storageCount;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatusDto.Creating,
    );

    try {
      await this.secretsService.createSecret(
        namespace,
        deploymentId,
        payload.sudoPassword,
      );
      await this.servicesService.createService(
        namespace,
        deploymentId,
        payload.deployment.properties.image.type,
      );
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
        DeploymentStatusDto.Failed,
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
    const namespace: string = KubeUtil.generateResourceName(
      payload.workspaceId,
    );
    const deploymentId: string = payload.deploymentId;
    await this.deploymentsService.updateStatus(
      deploymentId,
      DeploymentStatusDto.Updating,
    );
    try {
      await this.kubeDeploymentsService.updateDeployment(
        namespace,
        deploymentId,
        payload.updateDeploymentDto.properties,
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
        DeploymentStatusDto.Failed,
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
    const namespace: string = KubeUtil.generateResourceName(
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
   * Handles the deployment.connection.opened event
   * @param payload the deployment.connection.opened event payload
   */
  @OnEvent(Event.DeploymentConnectionOpened)
  private async handleDeploymentConnectionOpenedEvent(
    payload: DeploymentConnectionEvent,
  ): Promise<void> {
    try {
      const deploymentId: string =
        await this.servicesService.getDeploymentIdFromServiceClusterIp(
          payload.kubernetesServiceIp,
        );
      await this.deploymentsService.updateUsageStatus(deploymentId, true);
    } catch (error) {
      this.logger.error({
        message: 'Error handling deployment connection opened event',
        error,
      });
    }
  }

  /**
   * Handles the deployment.connection.closed event
   * @param payload the deployment.connection.closed event payload
   */
  @OnEvent(Event.DeploymentConnectionClosed)
  private async handleDeploymentConnectionClosedEvent(
    payload: DeploymentConnectionEvent,
  ): Promise<void> {
    try {
      const deploymentId: string =
        await this.servicesService.getDeploymentIdFromServiceClusterIp(
          payload.kubernetesServiceIp,
        );
      await this.deploymentsService.updateUsageStatus(deploymentId, false);
    } catch (error) {
      this.logger.error({
        message: 'Error handling deployment connection closed event',
        error,
      });
    }
  }

  /**
   * Cron job that runs every hour and deletes any Kubernetes
   * namespace that was not deleted when a workspace was deleted
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteRemainingKubernetesNamespacesJob(): Promise<void> {
    this.logger.log('Delete remaining Kubernetes namespaces cron job running');
    let deletedCount = 0;
    const {
      body: { items: namespaces },
    } = await this.namespacesService.getAllNamespaces();
    const workspaceNamespaces: WorkspaceNamespace[] =
      await this.getAllWorkspaceNamespaces();
    for (const namespace of namespaces) {
      const namespaceName: string = namespace.metadata?.name;
      if (
        workspaceNamespaces.findIndex((w) => w.namespace === namespaceName) ===
        -1
      ) {
        await this.namespacesService.deleteNamespace(namespaceName);
        deletedCount++;
      }
    }
    this.logger.log(
      `Delete remaining kubernetes namespaces cron job finished - ${deletedCount} namespaces deleted`,
    );
  }

  /**
   * Cron job that runs every hour and deletes any Kubernetes
   * resource that was not deleted when a deployment was
   * deleted
   */
  @Cron(CronExpression.EVERY_HOUR)
  private async deleteRemainingKubernetesResourcesJob(): Promise<void> {
    this.logger.log('Delete remaining Kubernetes resources cron job running');
    const deletedCount: DeletedKubernetesResourcesCount = {
      services: 0,
      deployments: 0,
      persistentVolumeClaims: 0,
      secrets: 0,
    };
    const workspaceNamespaces: WorkspaceNamespace[] =
      await this.getAllWorkspaceNamespaces();
    for (const workspaceNamespace of workspaceNamespaces) {
      const namespace: string = workspaceNamespace.namespace;
      const storedDeployments: DeploymentDocument[] =
        await this.deploymentsService.findAll(workspaceNamespace.workspaceId);
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
          deletedCount.services++;
        }
      }
      for (const deployment of deployments) {
        const deploymentId: string = deployment?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.kubeDeploymentsService.deleteDeployment(
            namespace,
            deploymentId,
          );
          deletedCount.deployments++;
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
          deletedCount.persistentVolumeClaims++;
        }
      }
      for (const secret of secrets) {
        const deploymentId: string = secret?.metadata?.labels?.deployment;
        if (!storedDeploymentIds.includes(deploymentId)) {
          await this.secretsService.deleteSecret(namespace, deploymentId);
          deletedCount.secrets++;
        }
      }
    }
    this.logger.log(
      `Delete remaining Kubernetes resources cron job finished - ${deletedCount.services} services, ${deletedCount.deployments} deployments, ${deletedCount.persistentVolumeClaims} persistent volume claims and ${deletedCount.secrets} secrets deleted`,
    );
  }

  /**
   * Cron job that runs every minute and updates a deployments
   * status based on the Kubernetes pod status
   */
  @Cron(CronExpression.EVERY_MINUTE)
  private async updateDeploymentStatusesJob(): Promise<void> {
    this.logger.log('Update deployment statuses cron job running');
    let updatedStatusCount = 0;
    const workspaceNamespaces: WorkspaceNamespace[] =
      await this.getAllWorkspaceNamespaces();
    for (const workspaceNamespace of workspaceNamespaces) {
      const {
        body: { items: pods },
      } = await this.podsService.getAllPods(workspaceNamespace.namespace);
      for (const pod of pods) {
        await this.updateDeploymentStatus(pod);
        updatedStatusCount++;
      }
    }
    this.logger.log(
      `Update deployment statuses cron job finished - ${updatedStatusCount} deployment statuses updated`,
    );
  }

  /**
   * Cron job that runs every 30 seconds and updates the replica count of
   * inactive deployments to zero (turns off down deployments)
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  private async turnOffInactiveDeploymentsJob(): Promise<void> {
    this.logger.log('Turn off inactive deployments cron job running');
    let turnedOffDeploymentCount = 0;
    const inactiveDeployments: DeploymentDocument[] =
      await this.deploymentsService.findAllInactive();
    for (const inactiveDeployment of inactiveDeployments) {
      try {
        await this.turnOffDeployment(
          inactiveDeployment.workspace._id,
          inactiveDeployment,
        );
        turnedOffDeploymentCount++;
      } catch (error) {
        this.logger.error({
          message: 'Error turning off inactive deployment (cron job)',
          deploymentId: inactiveDeployment._id,
          error,
        });
      }
    }
    this.logger.log(
      `Turn off inactive deployments cron job finished - ${turnedOffDeploymentCount} inactive deployments turned off`,
    );
  }

  /**
   * Updates a deployments status based on the Kubernetes
   * pod status
   * @param pod the deployments Kubernetes pod
   */
  private async updateDeploymentStatus(pod: k8s.V1Pod): Promise<void> {
    const deploymentId: string = pod.metadata?.labels?.deployment;
    if (!deploymentId) return;

    // Do not update the status of a deployment if the deployment status is STOPPED
    const deploymentStatus: DeploymentStatusDto =
      await this.deploymentsService.getStatus(deploymentId);
    if (deploymentStatus === DeploymentStatusDto.Stopped) {
      return;
    }

    const podPhase: string = pod.status?.phase;
    if (!podPhase || podPhase === PodPhase.Unknown) {
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatusDto.Unknown,
      );
    } else if (podPhase === PodPhase.Running) {
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatusDto.Running,
      );
    } else if (podPhase === PodPhase.Pending) {
      /**
       * Check if the pod can not be scheduled by Kubernetes due
       * to insufficient cluster resources
       */
      const conditions: k8s.V1PodCondition[] = pod.status?.conditions;
      if (!conditions || !conditions.length) return;
      const podScheduledConditionIndex: number = conditions.findIndex(
        (c) =>
          c.type === PodConditionType.PodScheduled &&
          c.status === PodConditionStatus.False &&
          c.reason === PodConditionReason.Unschedulable,
      );
      if (podScheduledConditionIndex === -1) return;
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatusDto.Failed,
        conditions[podScheduledConditionIndex].message,
      );
    } else if (podPhase === PodPhase.Failed) {
      await this.deploymentsService.updateStatus(
        deploymentId,
        DeploymentStatusDto.Failed,
      );
    }
  }

  /**
   * Get all workspace namespaces
   * @returns all workspace namespaces
   */
  private async getAllWorkspaceNamespaces(): Promise<WorkspaceNamespace[]> {
    const workspaces: WorkspaceDocument[] =
      await this.workspacesService.findAll();
    return workspaces.map(
      (w) =>
        new WorkspaceNamespace(w._id, KubeUtil.generateResourceName(w._id)),
    );
  }
}
