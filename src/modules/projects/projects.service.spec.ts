import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectNotFoundException } from './../../exceptions/project-not-found.exception';
import { CreateProjectDto } from './dto/create-project.dto';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import {
  Project,
  ProjectSchema,
  ProjectDocument,
} from './schemas/project.schema';
import {
  closeMongooseConnection,
  MongooseMockModule,
} from './../../../test/utils/mongoose-mock-module';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import { ProjectsService } from './projects.service';

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

let projectId: string;

describe('ProjectsService', () => {
  let service: ProjectsService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: Project.name, schema: ProjectSchema },
        ]),
      ],
      providers: [ProjectsService, EventEmitter2],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
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
    it('should create a project', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Project',
        description: 'project description',
      };
      const createdProject: ProjectDocument = await service.create(
        user,
        workspace,
        createProjectDto,
      );
      expect(createdProject.name).toBe(createProjectDto.name);
      expect(createdProject.description).toBe(createProjectDto.description);
      projectId = createdProject._id;
    });
  });

  describe('findAll', () => {
    it('should find all projects in the given workspace', async () => {
      const retrievedProjects: ProjectDocument[] = await service.findAll(
        workspace._id,
      );
      expect(retrievedProjects).toBeTruthy();
      expect(retrievedProjects[0].workspace._id).toEqual(workspace._id);
    });

    it('should find all projects in the given workspace for the given user', async () => {
      const retrievedProjects: ProjectDocument[] = await service.findAll(
        workspace._id,
        user._id,
      );
      expect(retrievedProjects).toBeTruthy();
      expect(retrievedProjects[0].user._id).toEqual(user._id);
      expect(retrievedProjects[0].workspace._id).toEqual(workspace._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the project with the given id was not found', async () => {
      const projectId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ProjectNotFoundException(
        projectId,
      ).message;
      try {
        await service.findOne(workspace._id, projectId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the project in the given workspace for the given user', async () => {
      const retrievedProject: ProjectDocument = await service.findOne(
        workspace._id,
        projectId,
        user._id,
      );
      expect(retrievedProject._id).toEqual(projectId);
      expect(retrievedProject.user._id).toEqual(user._id);
      expect(retrievedProject.workspace._id).toEqual(workspace._id);
    });
  });

  describe('update', () => {
    const updateProjectDto: UpdateProjectDto = {
      name: 'New Project',
      description: 'New project description',
    };
    it('should throw an error if the project with the given id was not found', async () => {
      const projectId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ProjectNotFoundException(
        projectId,
      ).message;
      try {
        await service.update(
          workspace._id,
          projectId,
          updateProjectDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the project', async () => {
      const updatedProject: ProjectDocument = await service.update(
        workspace._id,
        projectId,
        updateProjectDto,
        user._id,
      );
      expect(updatedProject._id).toEqual(projectId);
      expect(updatedProject.name).toBe(updateProjectDto.name);
      expect(updatedProject.description).toBe(updateProjectDto.description);
    });
  });

  describe('remove', () => {
    it('should throw an error if the project with the given id was not found', async () => {
      const projectId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ProjectNotFoundException(
        projectId,
      ).message;
      try {
        await service.remove(workspace._id, projectId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the project', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      await service.remove(workspace._id, projectId, user._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
