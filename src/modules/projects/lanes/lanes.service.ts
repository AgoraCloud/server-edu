import { ProjectCreatedEvent } from './../../../events/project-created.event';
import { ProjectLaneDeletedEvent } from './../../../events/project-lane-deleted.event';
import { ProjectLaneNotFoundException } from './../../../exceptions/project-lane-not-found.exception';
import { ProjectDeletedEvent } from './../../../events/project-deleted.event';
import { ProjectDocument } from './../schemas/project.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { ProjectLane, ProjectLaneDocument } from './schemas/lane.schema';
import { Injectable } from '@nestjs/common';
import { CreateProjectLaneDto } from './dto/create-lane.dto';
import { UpdateProjectLaneDto } from './dto/update-lane.dto';
import { Model, Query } from 'mongoose';
import { Event } from '../../../events/events.enum';

@Injectable()
export class ProjectLanesService {
  constructor(
    @InjectModel(ProjectLane.name)
    private readonly projectLaneModel: Model<ProjectLaneDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a project lane
   * @param user the user
   * @param workspace the workspace
   * @param project the project
   * @param createProjectLaneDto the project lane to create
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    project: ProjectDocument,
    createProjectLaneDto: CreateProjectLaneDto,
  ): Promise<ProjectLaneDocument> {
    const projectLane: ProjectLane = new ProjectLane(createProjectLaneDto);
    projectLane.user = user;
    projectLane.workspace = workspace;
    projectLane.project = project;
    const createdProjectLane: ProjectLaneDocument = await this.projectLaneModel.create(
      projectLane,
    );
    return createdProjectLane;
  }

  /**
   * Find all project lanes
   * @param projectId the project id
   * @param userId the users id
   * @param workspaceId the workspace is
   */
  async findAll(
    projectId: string,
    userId?: string,
    workspaceId?: string,
  ): Promise<ProjectLaneDocument[]> {
    let projectLanesQuery: Query<
      ProjectLaneDocument[],
      ProjectLaneDocument
    > = this.projectLaneModel.find().where('project').equals(projectId);
    if (userId) {
      projectLanesQuery = projectLanesQuery.where('user').equals(userId);
    }
    if (workspaceId) {
      projectLanesQuery = projectLanesQuery
        .where('workspace')
        .equals(workspaceId);
    }
    const projectLanes: ProjectLaneDocument[] = await projectLanesQuery.exec();
    return projectLanes;
  }

  /**
   * Find a project lane
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param userId the users id
   */
  async findOne(
    workspaceId: string,
    projectId: string,
    projectLaneId: string,
    userId?: string,
  ): Promise<ProjectLaneDocument> {
    let projectLaneQuery: Query<
      ProjectLaneDocument,
      ProjectLaneDocument
    > = this.projectLaneModel
      .findOne()
      .where('_id')
      .equals(projectLaneId)
      .where('workspace')
      .equals(workspaceId)
      .where('project')
      .equals(projectId);
    if (userId) {
      projectLaneQuery = projectLaneQuery.where('user').equals(userId);
    }
    const projectLane: ProjectLaneDocument = await projectLaneQuery.exec();
    if (!projectLane) throw new ProjectLaneNotFoundException(projectLaneId);
    return projectLane;
  }

  /**
   * Update a project lane
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param updateProjectLaneDto the updated project lane
   * @param userId the users id
   */
  async update(
    workspaceId: string,
    projectId: string,
    projectLaneId: string,
    updateProjectLaneDto: UpdateProjectLaneDto,
    userId?: string,
  ): Promise<ProjectLaneDocument> {
    let projectLaneQuery: Query<
      ProjectLaneDocument,
      ProjectLaneDocument
    > = this.projectLaneModel
      .findOneAndUpdate(null, updateProjectLaneDto, { new: true })
      .where('_id')
      .equals(projectLaneId)
      .where('workspace')
      .equals(workspaceId)
      .where('project')
      .equals(projectId);
    if (userId) {
      projectLaneQuery = projectLaneQuery.where('user').equals(userId);
    }
    const projectLane: ProjectLaneDocument = await projectLaneQuery.exec();
    if (!projectLane) throw new ProjectLaneNotFoundException(projectLaneId);
    return projectLane;
  }

  /**
   * Delete a project lane
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param projectLaneId the project lane id
   * @param userId the users id
   */
  async remove(
    workspaceId: string,
    projectId: string,
    projectLaneId: string,
    userId?: string,
  ): Promise<void> {
    let projectLaneQuery: Query<
      ProjectLaneDocument,
      ProjectLaneDocument
    > = this.projectLaneModel
      .findOneAndDelete()
      .where('_id')
      .equals(projectLaneId)
      .where('workspace')
      .equals(workspaceId)
      .where('project')
      .equals(projectId);
    if (userId) {
      projectLaneQuery = projectLaneQuery.where('user').equals(userId);
    }
    const projectLane: ProjectLaneDocument = await projectLaneQuery.exec();
    if (!projectLane) throw new ProjectLaneNotFoundException(projectLaneId);
    this.eventEmitter.emit(
      Event.ProjectLaneDeleted,
      new ProjectLaneDeletedEvent(projectLaneId),
    );
  }

  /**
   * Delete all project lanes
   * @param projectId the project id
   */
  private async removeAll(projectId: string): Promise<void> {
    const projectLanes: ProjectLaneDocument[] = await this.findAll(projectId);
    const projectLaneIds: string[] = projectLanes.map((l) => l._id);
    await this.projectLaneModel
      .deleteMany()
      .where('_id')
      .in(projectLaneIds)
      .exec();
    projectLaneIds.forEach((projectLaneId: string) => {
      this.eventEmitter.emit(
        Event.ProjectLaneDeleted,
        new ProjectLaneDeletedEvent(projectLaneId),
      );
    });
  }

  /**
   * Handles the project.created event
   * @param payload the project.created event payload
   */
  @OnEvent(Event.ProjectCreated)
  private async handleProjectCreatedEvent(
    payload: ProjectCreatedEvent,
  ): Promise<void> {
    // Create three lanes when a new project is created: To Do, In Progress and Done
    const laneNames: string[] = ['To Do', 'In Progress', 'Done'];
    for (const name of laneNames) {
      await this.create(
        payload.project.user,
        payload.project.workspace,
        payload.project,
        { name },
      );
    }
  }

  /**
   * handles the project.deleted event
   * @param payload the project.deleted event payload
   */
  @OnEvent(Event.ProjectDeleted)
  private async handleProjectDeletedEvent(
    payload: ProjectDeletedEvent,
  ): Promise<void> {
    await this.removeAll(payload.id);
  }
}
