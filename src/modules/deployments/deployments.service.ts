import { DeploymentNotRunningException } from './../../exceptions/deployment-not-running.exception';
import { deploymentImages } from './deployment-images';
import { DeploymentDeletedEvent } from './../../events/deployment-deleted.event';
import { DeploymentUpdatedEvent } from './../../events/deployment-updated.event';
import { DeploymentCreatedEvent } from './../../events/deployment-created.event';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { Event } from 'src/events/events.enum';

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
   * @param userId the users id
   * @param workspaceId the workspace id
   */
  async findAll(
    userId: string,
    workspaceId: string,
  ): Promise<DeploymentDocument[]> {
    return this.deploymentModel
      .find()
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId);
  }

  /**
   * Find a deployment
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  async findOne(
    userId: string,
    workspaceId: string,
    deploymentId: string,
  ): Promise<DeploymentDocument> {
    let deployment: DeploymentDocument;
    if (!workspaceId) {
      deployment = await this.deploymentModel
        .findOne()
        .where('_id')
        .equals(deploymentId)
        .where('user')
        .equals(userId);
    } else {
      deployment = await this.deploymentModel
        .findOne()
        .where('_id')
        .equals(deploymentId)
        .where('user')
        .equals(userId)
        .where('workspace')
        .equals(workspaceId);
    }
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
      userId,
      workspaceId,
      deploymentId,
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
      .equals(workspaceId);

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
        new DeploymentUpdatedEvent(deploymentId, updateDeploymentDto),
      );
    }
    return deployment;
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
    const deployment = await this.deploymentModel
      .findOneAndDelete()
      .where('_id')
      .equals(deploymentId)
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId);
    if (!deployment) throw new DeploymentNotFoundException(deploymentId);
    this.eventEmitter.emit(
      Event.DeploymentDeleted,
      new DeploymentDeletedEvent(deployment),
    );
  }

  /**
   * Update a deployments status
   * @param deploymentId the deployment id
   * @param status the deployment status
   */
  async updateStatus(
    deploymentId: string,
    status: DeploymentStatus,
  ): Promise<void> {
    await this.deploymentModel.updateOne({ _id: deploymentId }, { status });
  }
}
