import { UserDeletedEvent } from './../../events/user-deleted.event';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DeploymentTypeDto,
  DeploymentVersionDto,
  RoleDto,
} from '@agoracloud/common';
import { WorkspacesService } from './../workspaces/workspaces.service';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { NoProvisionedWorkstationException } from '../../exceptions/no-provisioned-workstation.exception';
import { WorkstationNotFoundException } from './../../exceptions/workstation-not-found.exception';
import { UsersService } from './../users/users.service';
import { DeploymentsService } from './../deployments/deployments.service';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { CreateWorkstationDto } from './dto/create-workstation.dto';
import {
  UpdateWorkstationDto,
  UpdateWorkstationUserDto,
  UpdateWorkstationPropertiesDto,
} from './dto/update-workstation.dto';
import { Workstation, WorkstationDocument } from './schema/workstation.schema';
import { Model } from 'mongoose';
import { Event } from '../../events/events.enum';

@Injectable()
export class WorkstationsService {
  constructor(
    @InjectModel(Workstation.name)
    private readonly workstationModel: Model<WorkstationDocument>,
    private readonly workspacesService: WorkspacesService,
    private readonly deploymentsService: DeploymentsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a workstation
   * @param createWorkstationDto the workstation to create
   * @returns the created workstation document
   */
  async create(
    createWorkstationDto: CreateWorkstationDto,
  ): Promise<WorkstationDocument> {
    // Create the workstation user
    const createdUser: UserDocument = await this.usersService.create(
      createWorkstationDto.user,
      RoleDto.User,
      true,
    );
    // Create the workstations workspace
    const createdWorkspace: WorkspaceDocument =
      await this.workspacesService.create(createdUser, {
        name: 'Default Workspace',
      });
    // Create the workstations deployment
    const createdDeployment = await this.deploymentsService.create(
      createdUser,
      createdWorkspace,
      {
        name: 'Default Deployment',
        properties: {
          isFavorite: true,
          scalingMethod: createWorkstationDto.properties.scalingMethod,
          image: {
            type: DeploymentTypeDto.Ubuntu,
            version: DeploymentVersionDto.Ubuntu_814b4f04,
          },
          resources: {
            cpuCount: createWorkstationDto.properties.cpuCount,
            memoryCount: createWorkstationDto.properties.memoryCount,
            storageCount: createWorkstationDto.properties.storageCount,
          },
          sudoPassword: createWorkstationDto.user.password,
        },
      },
    );
    // Create the workstation
    const createdWorkstation: WorkstationDocument =
      await this.workstationModel.create({
        name: createWorkstationDto.name,
        user: createdUser,
        workspace: createdWorkspace,
        deployment: createdDeployment,
      });
    return createdWorkstation;
  }

  /**
   * Find all workstations
   * @returns an array of workstation documents
   */
  findAll(): Promise<WorkstationDocument[]> {
    return this.workstationModel
      .find()
      .populate('user')
      .populate('workspace')
      .populate('deployment')
      .exec();
  }

  /**
   * Find a workstation
   * @param workstationId the workstation id
   * @throws WorkstationNotFoundException
   * @returns the workstation document
   */
  async findOne(workstationId: string): Promise<WorkstationDocument> {
    const workstation: WorkstationDocument = await this.workstationModel
      .findOne()
      .where('_id')
      .equals(workstationId)
      .populate('user')
      .populate('workspace')
      .populate('deployment')
      .exec();
    if (!workstation) throw new WorkstationNotFoundException(workstationId);
    return workstation;
  }

  /**
   * Get a users provisioned workstation
   * @param userId the users id
   * @throws NoProvisionedWorkstationException
   * @returns the users provisioned workstation
   */
  async findByUserId(userId: string): Promise<WorkstationDocument> {
    const workstation: WorkstationDocument = await this.workstationModel
      .findOne()
      .where('user')
      .equals(userId)
      .populate('user')
      .populate('workspace')
      .populate('deployment')
      .exec();
    if (!workstation) throw new NoProvisionedWorkstationException(userId);
    return workstation;
  }

  /**
   * Update a workstation
   * @param workstationId the workstation id
   * @param updateWorkstationDto the updated workstation
   * @returns the updated workstation
   */
  async update(
    workstationId: string,
    updateWorkstationDto: UpdateWorkstationDto,
  ): Promise<WorkstationDocument> {
    const workstation: WorkstationDocument = await this.findOne(workstationId);

    // Change the updated fields only
    workstation.name = updateWorkstationDto.name || workstation.name;
    const updateWorkstationUserDto: UpdateWorkstationUserDto =
      updateWorkstationDto.user;
    if (updateWorkstationUserDto) {
      workstation.user = await this.usersService.adminUpdate(
        workstation.user._id,
        updateWorkstationUserDto,
      );
    }
    const updateWorkstationPropertiesDto: UpdateWorkstationPropertiesDto =
      updateWorkstationDto.properties;
    if (updateWorkstationPropertiesDto) {
      workstation.deployment = await this.deploymentsService.update(
        workstation.workspace._id,
        workstation.deployment._id,
        {
          properties: {
            resources: {
              cpuCount: updateWorkstationPropertiesDto.cpuCount,
              memoryCount: updateWorkstationPropertiesDto.memoryCount,
            },
          },
        },
      );
    }

    await this.workstationModel
      .updateOne(null, workstation)
      .where('_id')
      .equals(workstationId)
      .exec();
    return workstation;
  }

  /**
   * Delete a workstation
   * @param workstationId the workstation id
   * @throws WorkstationNotFoundException
   */
  async remove(workstationId: string): Promise<void> {
    const workstation: WorkstationDocument = await this.workstationModel
      .findOneAndDelete()
      .where('_id')
      .equals(workstationId)
      .exec();
    if (!workstation) throw new WorkstationNotFoundException(workstationId);
    /**
     * When a workstation is deleted, delete the user attached to the workstation. This will lead to a
     * cascading effect where the users workspace and deployment are also deleted.
     */
    await this.usersService.remove(workstation.user._id);
  }

  /**
   * Delete the workstation of a specific user
   * @param userId the users id
   */
  private async removeByUserId(userId: string): Promise<void> {
    await this.workstationModel.deleteOne().where('user').equals(userId).exec();
  }

  /**
   * Handles the user.deleted event
   * @param payload the user.deleted event payload
   */
  @OnEvent(Event.UserDeleted)
  private async handleUserDeletedEvent(
    payload: UserDeletedEvent,
  ): Promise<void> {
    await this.removeByUserId(payload.id);
  }
}
