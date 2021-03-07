import { UpdateProjectLaneDto } from './dto/update-lane.dto';
import { ProjectLaneNotFoundException } from './../../../exceptions/project-lane-not-found.exception';
import { CreateProjectLaneDto } from './dto/create-lane.dto';
import { ProjectDocument } from './../schemas/project.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ProjectLane,
  ProjectLaneSchema,
  ProjectLaneDocument,
} from './schemas/lane.schema';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../../test/utils/mongoose-mock-module';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectLanesService } from './lanes.service';
import { Connection, Types } from 'mongoose';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
} as UserDocument;

const workspace: WorkspaceDocument = {
  _id: Types.ObjectId(),
  name: 'Test Workspace',
  users: [user],
} as WorkspaceDocument;

const project: ProjectDocument = {
  _id: Types.ObjectId(),
  name: 'Project 1',
  description: 'Project description',
  workspace,
  user,
} as ProjectDocument;

let projectLaneId: string;

describe('ProjectLanesService', () => {
  let service: ProjectLanesService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: ProjectLane.name, schema: ProjectLaneSchema },
        ]),
      ],
      providers: [ProjectLanesService, EventEmitter2],
    }).compile();

    service = module.get<ProjectLanesService>(ProjectLanesService);
    connection = await module.get(getConnectionToken());
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project lane', async () => {
      const createProjectLaneDto: CreateProjectLaneDto = {
        name: 'Project Lane',
      };
      const createdProjectLane: ProjectLaneDocument = await service.create(
        user,
        workspace,
        project,
        createProjectLaneDto,
      );
      expect(createdProjectLane.name).toBe(createProjectLaneDto.name);
      projectLaneId = createdProjectLane._id;
    });
  });

  describe('findAll', () => {
    it('should find all project lanes in the given project', async () => {
      const retrievedProjectLanes: ProjectLaneDocument[] = await service.findAll(
        project._id,
      );
      expect(retrievedProjectLanes).toBeTruthy();
      expect(retrievedProjectLanes[0].project._id).toEqual(project._id);
    });

    it('should find all project lanes in the given project for the given user', async () => {
      const retrievedProjectLanes: ProjectLaneDocument[] = await service.findAll(
        project._id,
        user._id,
      );
      expect(retrievedProjectLanes).toBeTruthy();
      expect(retrievedProjectLanes[0].user._id).toEqual(user._id);
      expect(retrievedProjectLanes[0].project._id).toEqual(project._id);
    });

    it('should find all project lanes in the given workspace and project for the given user', async () => {
      const retrievedProjectLanes: ProjectLaneDocument[] = await service.findAll(
        project._id,
        user._id,
        workspace._id,
      );
      expect(retrievedProjectLanes).toBeTruthy();
      expect(retrievedProjectLanes[0].user._id).toEqual(user._id);
      expect(retrievedProjectLanes[0].workspace._id).toEqual(workspace._id);
      expect(retrievedProjectLanes[0].project._id).toEqual(project._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the project lane with the given id was not found', async () => {
      const projectLaneId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ProjectLaneNotFoundException(
        projectLaneId,
      ).message;
      try {
        await service.findOne(
          workspace._id,
          project._id,
          projectLaneId,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the project lane in the given workspace and project for the given user', async () => {
      const retrievedProjectLane: ProjectLaneDocument = await service.findOne(
        workspace._id,
        project._id,
        projectLaneId,
        user._id,
      );
      expect(retrievedProjectLane._id).toEqual(projectLaneId);
      expect(retrievedProjectLane.user._id).toEqual(user._id);
      expect(retrievedProjectLane.workspace._id).toEqual(workspace._id);
      expect(retrievedProjectLane.project._id).toEqual(project._id);
    });
  });

  describe('update', () => {
    const updateProjectLaneDto: UpdateProjectLaneDto = {
      name: 'New Project Lane',
    };
    it('should throw an error if the project lane with the given id was not found', async () => {
      const projectLaneId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ProjectLaneNotFoundException(
        projectLaneId,
      ).message;
      try {
        await service.update(
          workspace._id,
          project._id,
          projectLaneId,
          updateProjectLaneDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the project lane', async () => {
      const updatedProjectLane: ProjectLaneDocument = await service.update(
        workspace._id,
        project._id,
        projectLaneId,
        updateProjectLaneDto,
        user._id,
      );
      expect(updatedProjectLane._id).toEqual(projectLaneId);
      expect(updatedProjectLane.name).toEqual(updateProjectLaneDto.name);
    });
  });

  describe('remove', () => {
    it('should throw an error if the project lane with the given id was not found', async () => {
      const projectLaneId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ProjectLaneNotFoundException(
        projectLaneId,
      ).message;
      try {
        await service.remove(
          workspace._id,
          project._id,
          projectLaneId,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the project lane', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      await service.remove(workspace._id, project._id, projectLaneId, user._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
