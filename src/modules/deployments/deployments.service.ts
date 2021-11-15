import { ProxyUtil } from './../proxy/utils/proxy.util';
import { DeploymentVersionCanNotBeUpgradedException } from './../../exceptions/deployment-version-can-not-be-upgraded.exception';
import { InvalidDeploymentVersionUpgradeException } from './../../exceptions/invalid-deployment-version-upgrade.exception';
import { DeploymentTypeMismatchException } from './../../exceptions/deployment-type-mismatch.exception';
import { DeploymentCannotBeUpdatedException } from '../../exceptions/deployment-cannot-be-updated.exception';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { DeploymentDeletedEvent } from './../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from './../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from './../../events/deployment-created.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Deployment } from './schemas/deployment.schema';
import { DeploymentNotFoundException } from './../../exceptions/deployment-not-found.exception';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { DeploymentDocument } from './schemas/deployment.schema';
import { Model, Query } from 'mongoose';
import { Injectable } from '@nestjs/common';
import {
  CreateDeploymentDto,
  DeploymentStatusDto,
  UpdateDeploymentDto,
  UpdateDeploymentResourcesDto,
  DEPLOYMENT_IMAGES_DTO,
  DeploymentImageDto,
  UpdateDeploymentImageDto,
  DeploymentTypeDto,
  DeploymentScalingMethodDto,
} from '@agoracloud/common';
import { Event } from '../../events/events.enum';
import { isDefined } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { DateUtil } from '../../utils/date.util';

@Injectable()
export class DeploymentsService {
  private readonly domain: string;

  constructor(
    @InjectModel(Deployment.name)
    private readonly deploymentModel: Model<DeploymentDocument>,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.domain = this.configService.get<string>('domain');
  }

  /**
   * Create a deployment
   * @param user the user
   * @param workspace the workspace
   * @param createDeploymentDto the deployment to create
   * @returns the created deployment document
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    createDeploymentDto: CreateDeploymentDto,
  ): Promise<DeploymentDocument> {
    const sudoPassword: string = createDeploymentDto.properties.sudoPassword;
    // Remove the sudoPassword field
    delete createDeploymentDto.properties.sudoPassword;
    const deployment: Deployment = new Deployment(createDeploymentDto);
    deployment.user = user;
    deployment.workspace = workspace;
    deployment.internalProperties = {
      isCurrentlyInUse: false,
      lastActiveAt: new Date(),
    };

    const createdDeployment: DeploymentDocument =
      await this.deploymentModel.create(deployment);
    await this.generateAndUpdateProxyUrl(createdDeployment);
    this.eventEmitter.emit(
      Event.DeploymentCreated,
      new DeploymentCreatedEvent(sudoPassword, createdDeployment),
    );
    return createdDeployment;
  }

  /**
   * Find all deployment images
   * @returns all deployment images
   */
  findAllImages(): DeploymentImageDto[] {
    return DEPLOYMENT_IMAGES_DTO;
  }

  /**
   * Find all deployments
   * @param workspaceId the workspace id
   * @param userId the users id
   * @returns an array of deployment documents
   */
  async findAll(
    workspaceId: string,
    userId?: string,
  ): Promise<DeploymentDocument[]> {
    let deploymentsQuery: Query<DeploymentDocument[], DeploymentDocument> =
      this.deploymentModel.find().where('workspace').equals(workspaceId);
    if (userId) {
      deploymentsQuery = deploymentsQuery.where('user').equals(userId);
    }
    const deployments: DeploymentDocument[] = await deploymentsQuery.exec();
    return deployments;
  }

  /**
   * Find all deployments that are inactive (inactive deployments are deployments that
   * have the scaling method ON_DEMAND, are currently running, are not currently in use
   * and have not been used in the past 15 minutes or more)
   * @returns an array of deployment documents
   */
  async findAllInactive(): Promise<DeploymentDocument[]> {
    const fifteenMinutesAgo: Date = DateUtil.removeMinutes(new Date(), 15);
    const inactiveDeployments: DeploymentDocument[] = await this.deploymentModel
      .find({
        'internalProperties.lastActiveAt': {
          $lte: fifteenMinutesAgo,
        },
      })
      .where('status')
      .equals(DeploymentStatusDto.Running)
      .where('properties.scalingMethod')
      .equals(DeploymentScalingMethodDto.OnDemand)
      .where('internalProperties.isCurrentlyInUse')
      .equals(false)
      .exec();
    return inactiveDeployments;
  }

  /**
   * Find a deployment
   * @param deploymentId the deployment id
   * @param userId the users id
   * @param workspaceId the workspace id
   * @throws DeploymentNotFoundException
   * @returns a deployment document
   */
  async findOne(
    deploymentId: string,
    userId?: string,
    workspaceId?: string,
  ): Promise<DeploymentDocument> {
    let deploymentQuery: Query<DeploymentDocument, DeploymentDocument> =
      this.deploymentModel.findOne().where('_id').equals(deploymentId);
    if (userId) {
      deploymentQuery = deploymentQuery.where('user').equals(userId);
    }
    if (workspaceId) {
      deploymentQuery = deploymentQuery.where('workspace').equals(workspaceId);
    }
    const deployment: DeploymentDocument = await deploymentQuery.exec();
    if (!deployment) throw new DeploymentNotFoundException(deploymentId);
    return deployment;
  }

  /**
   * Get the status of a deployment
   * @param deploymentId the deployment id
   * @returns the status of the deployment
   */
  async getStatus(deploymentId: string): Promise<DeploymentStatusDto> {
    const deployment: DeploymentDocument = await this.deploymentModel
      .findOne(undefined, 'status')
      .where('_id')
      .equals(deploymentId)
      .exec();
    if (!deployment) throw new DeploymentNotFoundException(deploymentId);
    return deployment.status;
  }

  /**
   * Update a deployment
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param updateDeploymentDto the updated deployment
   * @param userId the users id
   * @throws DeploymentCannotBeUpdatedException
   * @returns the updated deployment document
   */
  async update(
    workspaceId: string,
    deploymentId: string,
    updateDeploymentDto: UpdateDeploymentDto,
    userId?: string,
  ): Promise<DeploymentDocument> {
    const deployment: DeploymentDocument = await this.findOne(
      deploymentId,
      userId,
      workspaceId,
    );
    const allowedStatuses: DeploymentStatusDto[] = [
      DeploymentStatusDto.Running,
      DeploymentStatusDto.Failed,
    ];
    if (!allowedStatuses.includes(deployment.status)) {
      throw new DeploymentCannotBeUpdatedException(deploymentId);
    }

    // Tracks whether a deployments Kubernetes specific attributes were updated
    let isDeploymentUpdated = false;

    // Change the updated fields only
    deployment.name = updateDeploymentDto.name || deployment.name;
    const updateDeploymentDtoIsFavorite: boolean =
      updateDeploymentDto.properties?.isFavorite;
    if (
      isDefined(updateDeploymentDtoIsFavorite) &&
      updateDeploymentDtoIsFavorite !== deployment.properties.isFavorite
    ) {
      deployment.properties.isFavorite = updateDeploymentDtoIsFavorite;
    }
    const updateDeploymentResourcesDto: UpdateDeploymentResourcesDto =
      updateDeploymentDto.properties?.resources;
    // Check if a new cpu count has been supplied
    const newCpuCount: number = updateDeploymentResourcesDto?.cpuCount;
    if (
      isDefined(newCpuCount) &&
      deployment.properties.resources.cpuCount !== newCpuCount
    ) {
      deployment.properties.resources.cpuCount = newCpuCount;
      isDeploymentUpdated = true;
    }
    // Check if a new memory count has been supplied
    const newMemoryCount: number = updateDeploymentResourcesDto?.memoryCount;
    if (
      isDefined(newMemoryCount) &&
      deployment.properties.resources.memoryCount !== newMemoryCount
    ) {
      deployment.properties.resources.memoryCount = newMemoryCount;
      isDeploymentUpdated = true;
    }

    // Check if a new deployment image version has been supplied
    const updateDeploymentImageDto: UpdateDeploymentImageDto =
      updateDeploymentDto.properties?.image;
    if (updateDeploymentImageDto) {
      if (updateDeploymentImageDto.type !== deployment.properties.image.type) {
        throw new DeploymentTypeMismatchException(
          deploymentId,
          deployment.properties.image.type,
          updateDeploymentImageDto.type,
        );
      }
      const newImageIndex: number = DEPLOYMENT_IMAGES_DTO.findIndex(
        (i: DeploymentImageDto) =>
          i.type === updateDeploymentImageDto.type &&
          i.version === updateDeploymentImageDto.version,
      );
      const currentImageIndex: number = DEPLOYMENT_IMAGES_DTO.findIndex(
        (i: DeploymentImageDto) =>
          i.type === deployment.properties.image.type &&
          i.version === deployment.properties.image.version,
      );
      // Versions of deployments with type UBUNTU can not be upgraded
      if (
        updateDeploymentImageDto.type === DeploymentTypeDto.Ubuntu &&
        newImageIndex !== currentImageIndex
      ) {
        throw new DeploymentVersionCanNotBeUpgradedException(
          deploymentId,
          updateDeploymentImageDto.type,
        );
      }
      if (newImageIndex >= currentImageIndex) {
        throw new InvalidDeploymentVersionUpgradeException(
          deploymentId,
          deployment.properties.image.version,
          updateDeploymentImageDto.version,
        );
      }
      deployment.properties.image.version = updateDeploymentImageDto.version;
      isDeploymentUpdated = true;
    }

    let deploymentQuery: Query<
      { ok: number; n: number; nModified: number },
      DeploymentDocument
    > = this.deploymentModel
      .updateOne(null, deployment)
      .where('_id')
      .equals(deploymentId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      deploymentQuery = deploymentQuery.where('user').equals(userId);
    }
    await deploymentQuery.exec();

    /**
     * Send the deployment.updated event only if cpuCount, memoryCount and/or
     * image version have been updated
     */
    if (isDeploymentUpdated) {
      this.eventEmitter.emit(
        Event.DeploymentUpdated,
        new DeploymentUpdatedEvent(
          workspaceId,
          deploymentId,
          updateDeploymentDto,
        ),
      );
    }
    return deployment;
  }

  /**
   * Update a deployments status and failure reason
   * @param deploymentId the deployment id
   * @param status the deployment status
   * @param failureReason failure reason if a deployments status is FAILED
   * @throws DeploymentNotFoundException
   */
  async updateStatus(
    deploymentId: string,
    status: DeploymentStatusDto,
    failureReason?: string,
  ): Promise<void> {
    await this.deploymentModel
      .updateOne({ _id: deploymentId }, { status, failureReason })
      .exec();
  }

  /**
   * Update a deployments usage status
   * @param deploymentId the deployment id
   * @param isCurrentlyInUse boolean indicating whether the deployment is currently in use or not
   */
  async updateUsageStatus(
    deploymentId: string,
    isCurrentlyInUse: boolean,
  ): Promise<void> {
    const updatedDeployment: DeploymentDocument = {
      internalProperties: { isCurrentlyInUse },
    } as DeploymentDocument;
    if (!isCurrentlyInUse) {
      updatedDeployment.internalProperties.lastActiveAt = new Date();
    }
    await this.deploymentModel
      .updateOne({ _id: deploymentId }, updatedDeployment)
      .exec();
  }

  /**
   * Delete a deployment
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param userId the users id
   */
  async remove(
    workspaceId: string,
    deploymentId: string,
    userId?: string,
  ): Promise<void> {
    let deploymentQuery: Query<DeploymentDocument, DeploymentDocument> =
      this.deploymentModel
        .findOneAndDelete()
        .where('_id')
        .equals(deploymentId)
        .where('workspace')
        .equals(workspaceId);
    if (userId) {
      deploymentQuery = deploymentQuery.where('user').equals(userId);
    }
    const deployment: DeploymentDocument = await deploymentQuery.exec();
    if (!deployment) throw new DeploymentNotFoundException(deploymentId);
    this.eventEmitter.emit(
      Event.DeploymentDeleted,
      new DeploymentDeletedEvent(deployment),
    );
  }

  /**
   * Delete all deployments for the given workspace
   * @param workspaceId the workspace id
   * @param userId the users id
   * @param emitEvents controls whether the deployment.deleted event should be fired
   */
  private async removeAll(
    workspaceId: string,
    userId?: string,
    emitEvents = false,
  ): Promise<void> {
    const deployments: DeploymentDocument[] = await this.findAll(
      workspaceId,
      userId,
    );
    const deploymentIds: string[] = deployments.map((d) => d._id);
    await this.deploymentModel
      .deleteMany()
      .where('_id')
      .in(deploymentIds)
      .exec();
    if (emitEvents) {
      deployments.forEach((deployment: DeploymentDocument) => {
        this.eventEmitter.emit(
          Event.DeploymentDeleted,
          new DeploymentDeletedEvent(deployment),
        );
      });
    }
  }

  /**
   * Generates and updates a deployments publicly accessible proxy URL
   * @param deployment the deployment to update
   */
  private async generateAndUpdateProxyUrl(
    deployment: DeploymentDocument,
  ): Promise<void> {
    deployment.properties.proxyUrl = ProxyUtil.generatePublicProxyUrl(
      this.domain,
      deployment._id,
    );
    await this.deploymentModel
      .updateOne({ _id: deployment._id }, deployment)
      .exec();
  }

  /**
   * Handles the workspace.deleted event
   * @param payload the workspace.deleted event payload
   */
  @OnEvent(Event.WorkspaceDeleted)
  private async handleWorkspaceDeletedEvent(
    payload: WorkspaceDeletedEvent,
  ): Promise<void> {
    await this.removeAll(payload.id);
  }

  /**
   * Handles the workspace.user.removed event
   * @param payload the workspace.user.removed event payload
   */
  @OnEvent(Event.WorkspaceUserRemoved)
  private async handleWorkspaceUserRemovedEvent(
    payload: WorkspaceUserRemovedEvent,
  ): Promise<void> {
    await this.removeAll(payload.workspaceId, payload.userId, true);
  }
}
