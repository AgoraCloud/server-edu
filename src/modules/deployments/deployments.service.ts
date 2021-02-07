import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { DeploymentNotRunningException } from './../../exceptions/deployment-not-running.exception';
import { deploymentImages } from './deployment-images';
import { DeploymentDeletedEvent } from './../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from './../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from './../../events/deployment-created.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import {
  Deployment,
  DeploymentImage,
  DeploymentStatus,
} from './schemas/deployment.schema';
import { DeploymentNotFoundException } from './../../exceptions/deployment-not-found.exception';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { DeploymentDocument } from './schemas/deployment.schema';
import { Model, Query } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { Event } from '../../events/events.enum';

@Injectable()
export class DeploymentsService {
  private readonly deploymentImages: DeploymentImage[];

  constructor(
    @InjectModel(Deployment.name)
    private readonly deploymentModel: Model<DeploymentDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.deploymentImages = deploymentImages;
  }

  /**
   * Create a deployment
   * @param user the user
   * @param workspace the workspace
   * @param createDeploymentDto the deployment to create
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

    const createdDeployment: DeploymentDocument = await this.deploymentModel.create(
      deployment,
    );
    this.eventEmitter.emit(
      Event.DeploymentCreated,
      new DeploymentCreatedEvent(sudoPassword, createdDeployment),
    );
    return createdDeployment;
  }

  /**
   * Find all deployment images
   */
  findAllImages(): DeploymentImage[] {
    return this.deploymentImages;
  }

  /**
   * Find all deployments
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  async findAll(
    workspaceId: string,
    userId?: string,
  ): Promise<DeploymentDocument[]> {
    let deploymentsQuery: Query<
      DeploymentDocument[],
      DeploymentDocument
    > = this.deploymentModel.find().where('workspace').equals(workspaceId);
    if (userId) {
      deploymentsQuery = deploymentsQuery.where('user').equals(userId);
    }
    const deployments: DeploymentDocument[] = await deploymentsQuery.exec();
    return deployments;
  }

  /**
   * Find a deployment
   * @param deploymentId the deployment id
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  async findOne(
    deploymentId: string,
    userId?: string,
    workspaceId?: string,
  ): Promise<DeploymentDocument> {
    let deploymentQuery: Query<
      DeploymentDocument,
      DeploymentDocument
    > = this.deploymentModel.findOne().where('_id').equals(deploymentId);
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
   * Update a deployment
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param updateDeploymentDto the updated deployment
   */
  async update(
    userId: string,
    workspaceId: string,
    deploymentId: string,
    updateDeploymentDto: UpdateDeploymentDto,
  ): Promise<DeploymentDocument> {
    const deployment: DeploymentDocument = await this.findOne(
      deploymentId,
      userId,
      workspaceId,
    );
    if (deployment.status !== DeploymentStatus.Running) {
      throw new DeploymentNotRunningException(deploymentId);
    }

    // Change the updated fields only
    deployment.name = updateDeploymentDto.name || deployment.name;
    deployment.properties.resources.cpuCount =
      updateDeploymentDto.properties?.resources?.cpuCount ||
      deployment.properties.resources.cpuCount;
    deployment.properties.resources.memoryCount =
      updateDeploymentDto.properties?.resources?.memoryCount ||
      deployment.properties.resources.memoryCount;
    await this.deploymentModel
      .updateOne(null, deployment)
      .where('_id')
      .equals(deploymentId)
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId)
      .exec();

    /**
     * Send the deployment.updated event only if cpuCount or
     * memoryCount have been updated
     */
    if (
      updateDeploymentDto.properties?.resources?.cpuCount ||
      updateDeploymentDto.properties?.resources?.memoryCount
    ) {
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
   */
  async updateStatus(
    deploymentId: string,
    status: DeploymentStatus,
    failureReason?: string,
  ): Promise<void> {
    await this.deploymentModel
      .updateOne({ _id: deploymentId }, { status, failureReason })
      .exec();
  }

  /**
   * Delete a deployment
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  async remove(
    userId: string,
    workspaceId: string,
    deploymentId: string,
  ): Promise<void> {
    const deployment: DeploymentDocument = await this.deploymentModel
      .findOneAndDelete()
      .where('_id')
      .equals(deploymentId)
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId)
      .exec();
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
  private async handleWorkspaceUserRemoved(
    payload: WorkspaceUserRemovedEvent,
  ): Promise<void> {
    await this.removeAll(payload.workspaceId, payload.userId, true);
  }
}
