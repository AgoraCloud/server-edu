import { WorkspaceCreatedEvent } from './../../events/workspace-created.event';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { UserDeletedEvent } from './../../events/user-deleted.event';
import { WorkspaceDeletedEvent } from '../../events/workspace-deleted.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WorkspaceNotFoundException } from './../../exceptions/workspace-not-found.exception';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace, WorkspaceDocument } from './schemas/workspace.schema';
import { Injectable } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import {
  UpdateWorkspaceDto,
  UpdateWorkspaceResourcesDto,
} from './dto/update-workspace.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { Model, Query } from 'mongoose';
import { Event } from '../../events/events.enum';
import { WorkspaceUpdatedEvent } from '../../events/workspace-updated.event';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel: Model<WorkspaceDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a workspace
   * @param user the user
   * @param createWorkspaceDto the workspace to create
   */
  async create(
    user: UserDocument,
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<WorkspaceDocument> {
    const workspace: Workspace = new Workspace(createWorkspaceDto);
    workspace.users = [user._id];
    const createdWorkspace: WorkspaceDocument = await this.workspaceModel.create(
      workspace,
    );
    this.eventEmitter.emit(
      Event.WorkspaceCreated,
      new WorkspaceCreatedEvent(createdWorkspace),
    );
    return createdWorkspace;
  }

  /**
   * Find all workspaces
   * @param userId the users id
   */
  async findAll(userId?: string): Promise<WorkspaceDocument[]> {
    let workspacesQuery: Query<
      WorkspaceDocument[],
      WorkspaceDocument
    > = this.workspaceModel.find();
    if (userId) {
      workspacesQuery = workspacesQuery.where('users').in([userId]);
    }
    return workspacesQuery.exec();
  }

  /**
   * Find a workspace
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  async findOne(
    workspaceId: string,
    userId?: string,
  ): Promise<WorkspaceDocument> {
    let workspaceQuery: Query<
      WorkspaceDocument,
      WorkspaceDocument
    > = this.workspaceModel.findOne().where('_id').equals(workspaceId);
    if (userId) {
      workspaceQuery = workspaceQuery.where('users').in([userId]);
    }
    const workspace: WorkspaceDocument = await workspaceQuery.exec();
    if (!workspace) throw new WorkspaceNotFoundException(workspaceId);
    return workspace;
  }

  /**
   * Update a workspace
   * @param workspaceId the workspace id
   * @param updateWorkspaceDto the updated workspace
   * @param userId the users id
   */
  async update(
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
    userId?: string,
  ): Promise<WorkspaceDocument> {
    const workspace: WorkspaceDocument = await this.findOne(
      workspaceId,
      userId,
    );

    // Change the updated fields only
    workspace.name = updateWorkspaceDto.name || workspace.name;
    const updateWorkspaceResourcesDto: UpdateWorkspaceResourcesDto =
      updateWorkspaceDto.properties?.resources;
    if (!workspace.properties) {
      workspace.properties = {};
    }
    if (!workspace.properties.resources) {
      workspace.properties.resources = {};
    }
    if (updateWorkspaceResourcesDto?.cpuCount === 0) {
      workspace.properties.resources.cpuCount = null;
    } else {
      workspace.properties.resources.cpuCount =
        updateWorkspaceResourcesDto?.cpuCount ||
        workspace.properties.resources.cpuCount;
    }
    if (updateWorkspaceResourcesDto?.memoryCount === 0) {
      workspace.properties.resources.memoryCount = null;
    } else {
      workspace.properties.resources.memoryCount =
        updateWorkspaceResourcesDto?.memoryCount ||
        workspace.properties.resources.memoryCount;
    }
    if (updateWorkspaceResourcesDto?.storageCount === 0) {
      workspace.properties.resources.storageCount = null;
    } else {
      workspace.properties.resources.storageCount =
        updateWorkspaceResourcesDto?.storageCount ||
        workspace.properties.resources.storageCount;
    }

    let workspaceQuery: Query<
      { ok: number; n: number; nModified: number },
      WorkspaceDocument
    > = this.workspaceModel
      .updateOne(null, workspace)
      .where('_id')
      .equals(workspaceId);
    if (userId) {
      workspaceQuery = workspaceQuery.where('users').in([userId]);
    }
    await workspaceQuery.exec();

    /**
     * Checks if a number is defined
     * @param num the number to check
     */
    const isDefined = (num: number): boolean => {
      return num !== undefined;
    };
    /**
     * Send the workspace.updated event only if cpuCount, memoryCount
     *  and/or storageCount have been updated
     */
    if (
      isDefined(updateWorkspaceResourcesDto?.cpuCount) ||
      isDefined(updateWorkspaceResourcesDto?.memoryCount) ||
      isDefined(updateWorkspaceResourcesDto?.storageCount)
    ) {
      this.eventEmitter.emit(
        Event.WorkspaceUpdated,
        new WorkspaceUpdatedEvent(workspace),
      );
    }
    return workspace;
  }

  /**
   * Delete a workspace
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  async remove(workspaceId: string, userId?: string): Promise<void> {
    let workspaceQuery: Query<
      WorkspaceDocument,
      WorkspaceDocument
    > = this.workspaceModel.findOneAndDelete().where('_id').equals(workspaceId);
    if (userId) {
      workspaceQuery = workspaceQuery.where('users').in([userId]);
    }
    const workspace = await workspaceQuery.exec();
    if (!workspace) throw new WorkspaceNotFoundException(workspaceId);
    this.eventEmitter.emit(
      Event.WorkspaceDeleted,
      new WorkspaceDeletedEvent(workspaceId),
    );
  }

  /**
   * Handles the user.deleted event
   * @param payload the user.deleted event payload
   */
  @OnEvent(Event.UserDeleted)
  private async handleUserDeletedEvent(
    payload: UserDeletedEvent,
  ): Promise<void> {
    const userId: string = payload.id;
    const workspaces: WorkspaceDocument[] = await this.findAll(userId);
    for (const workspace of workspaces) {
      const workspaceId: string = workspace._id;
      // The user is the only user in the workspace, delete the workspace
      if (workspace.users.length === 1) {
        await this.remove(workspaceId, userId);
      } else {
        // Remove the user from the workspace users
        workspace.users = workspace.users.filter((u) => u._id !== userId);
        await this.workspaceModel
          .updateOne({ _id: workspaceId }, { users: workspace.users })
          .exec();
        this.eventEmitter.emit(
          Event.WorkspaceUserRemoved,
          new WorkspaceUserRemovedEvent(workspaceId, userId),
        );
      }
    }
  }
}
