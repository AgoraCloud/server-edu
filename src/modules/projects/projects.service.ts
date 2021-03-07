import { ProjectCreatedEvent } from './../../events/project-created.event';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { ProjectDeletedEvent } from './../../events/project-deleted.event';
import { ProjectNotFoundException } from './../../exceptions/project-not-found.exception';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project, ProjectDocument } from './schemas/project.schema';
import { Model, Query } from 'mongoose';
import { Event } from '../../events/events.enum';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a project
   * @param user the user
   * @param workspace the workspace
   * @param createProjectDto the project to create
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectDocument> {
    const project: Project = new Project(createProjectDto);
    project.user = user;
    project.workspace = workspace;
    const createdProject: ProjectDocument = await this.projectModel.create(
      project,
    );
    this.eventEmitter.emit(
      Event.ProjectCreated,
      new ProjectCreatedEvent(createdProject),
    );
    return createdProject;
  }

  /**
   * Find all projects
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  async findAll(
    workspaceId: string,
    userId?: string,
  ): Promise<ProjectDocument[]> {
    let projectsQuery: Query<
      ProjectDocument[],
      ProjectDocument
    > = this.projectModel.find().where('workspace').equals(workspaceId);
    if (userId) {
      projectsQuery = projectsQuery.where('user').equals(userId);
    }
    const projects: ProjectDocument[] = await projectsQuery.exec();
    return projects;
  }

  /**
   * Find a project
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param userId the users id
   */
  async findOne(
    workspaceId: string,
    projectId: string,
    userId?: string,
  ): Promise<ProjectDocument> {
    let projectQuery: Query<
      ProjectDocument,
      ProjectDocument
    > = this.projectModel
      .findOne()
      .where('_id')
      .equals(projectId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      projectQuery = projectQuery.where('user').equals(userId);
    }
    const project: ProjectDocument = await projectQuery.exec();
    if (!project) throw new ProjectNotFoundException(projectId);
    return project;
  }

  /**
   * Update a project
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param updateProjectDto the updated project
   * @param userId the users id
   */
  async update(
    workspaceId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId?: string,
  ): Promise<ProjectDocument> {
    let projectQuery: Query<
      ProjectDocument,
      ProjectDocument
    > = this.projectModel
      .findOneAndUpdate(null, updateProjectDto, { new: true })
      .where('_id')
      .equals(projectId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      projectQuery = projectQuery.where('user').equals(userId);
    }
    const project: ProjectDocument = await projectQuery.exec();
    if (!project) throw new ProjectNotFoundException(projectId);
    return project;
  }

  /**
   * Delete a project
   * @param workspaceId the workspace id
   * @param projectId the project id
   * @param userId the users id
   */
  async remove(
    workspaceId: string,
    projectId: string,
    userId?: string,
  ): Promise<void> {
    let projectQuery: Query<
      ProjectDocument,
      ProjectDocument
    > = this.projectModel
      .findOneAndDelete()
      .where('_id')
      .equals(projectId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      projectQuery = projectQuery.where('user').equals(userId);
    }
    const project: ProjectDocument = await projectQuery.exec();
    if (!project) throw new ProjectNotFoundException(projectId);
    this.eventEmitter.emit(
      Event.ProjectDeleted,
      new ProjectDeletedEvent(projectId),
    );
  }

  /**
   * Delete all projects
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  private async removeAll(workspaceId: string, userId?: string): Promise<void> {
    const projects: ProjectDocument[] = await this.findAll(workspaceId, userId);
    const projectIds: string[] = projects.map((p) => p._id);
    await this.projectModel.deleteMany().where('_id').in(projectIds).exec();
    projectIds.forEach((projectId: string) => {
      this.eventEmitter.emit(
        Event.ProjectDeleted,
        new ProjectDeletedEvent(projectId),
      );
    });
  }

  /**
   * Handles the workspace.deleted event
   * @param payload the workspace.deleted event payload
   */
  @OnEvent(Event.WorkspaceDeleted)
  private async handleProjectDeletedEvent(
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
    await this.removeAll(payload.workspaceId, payload.userId);
  }
}
