import { DeploymentNotRunningException } from './../../exceptions/deployment-not-running.exception';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { DeploymentNotFoundException } from './../../exceptions/deployment-not-found.exception';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import { deploymentImages } from './deployment-images';
import {
  DeploymentSchema,
  DeploymentImage,
  DeploymentDocument,
  DeploymentStatus,
} from './schemas/deployment.schema';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, Types } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentsService } from './deployments.service';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: '',
  isEnabled: true,
  isVerified: true,
  isAdmin: false,
} as UserDocument;

const workspace: WorkspaceDocument = {
  _id: Types.ObjectId(),
  name: 'Test Workspace',
  users: [user],
} as WorkspaceDocument;

let deploymentId: string;

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: 'Deployment', schema: DeploymentSchema },
        ]),
      ],
      providers: [DeploymentsService, EventEmitter2],
    }).compile();

    service = module.get<DeploymentsService>(DeploymentsService);
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
    it('create a deployment', async () => {
      const createDeploymentDto: CreateDeploymentDto = {
        name: 'Test Deployment',
        properties: {
          image: {
            name: deploymentImages[0].name,
            tag: deploymentImages[0].tag,
          },
          resources: {
            cpuCount: 1,
            memoryCount: 2,
            storageCount: 8,
          },
          sudoPassword: 'Sudo Password',
        },
      };
      const createdDeployment: DeploymentDocument = await service.create(
        user,
        workspace,
        createDeploymentDto,
      );
      expect(createdDeployment.name).toBe(createDeploymentDto.name);
      expect(createDeploymentDto.properties.sudoPassword).toBe(
        createDeploymentDto.properties.sudoPassword,
      );
      expect(createDeploymentDto.properties.image.name).toBe(
        createDeploymentDto.properties.image.name,
      );
      expect(createDeploymentDto.properties.image.tag).toBe(
        createDeploymentDto.properties.image.tag,
      );
      expect(createDeploymentDto.properties.resources.cpuCount).toBe(
        createDeploymentDto.properties.resources.cpuCount,
      );
      expect(createDeploymentDto.properties.resources.memoryCount).toBe(
        createDeploymentDto.properties.resources.memoryCount,
      );
      expect(createDeploymentDto.properties.resources.storageCount).toBe(
        createDeploymentDto.properties.resources.storageCount,
      );
      deploymentId = createdDeployment._id;
    });
  });

  describe('findAllImages', () => {
    it('should find all deployment images', () => {
      const retrievedDeploymentImages: DeploymentImage[] = service.findAllImages();
      expect(retrievedDeploymentImages).toBe(deploymentImages);
    });
  });

  describe('findAll', () => {
    it('should find all deployments in the given workspace', async () => {
      const retrievedDeployments: DeploymentDocument[] = await service.findAll(
        workspace._id,
      );
      expect(retrievedDeployments).toHaveLength(1);
      expect(retrievedDeployments[0].workspace._id).toEqual(workspace._id);
    });

    it('should find all deployments in the given workspace for the given user', async () => {
      const retrievedDeployments: DeploymentDocument[] = await service.findAll(
        workspace._id,
        user._id,
      );
      expect(retrievedDeployments).toHaveLength(1);
      expect(retrievedDeployments[0].workspace._id).toEqual(workspace._id);
      expect(retrievedDeployments[0].user._id).toEqual(user._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the deployment with the given id was not found', async () => {
      const deploymentId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new DeploymentNotFoundException(
        deploymentId,
      ).message;
      try {
        await service.findOne(deploymentId, user._id, workspace._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the deployment in the given workspace for the given user', async () => {
      const retrievedDeployment: DeploymentDocument = await service.findOne(
        deploymentId,
        user._id,
        workspace._id,
      );
      expect(retrievedDeployment._id).toEqual(deploymentId);
      expect(retrievedDeployment.workspace._id).toEqual(workspace._id);
      expect(retrievedDeployment.user._id).toEqual(user._id);
    });

    it('should find the deployment for the given user', async () => {
      const retrievedDeployment: DeploymentDocument = await service.findOne(
        deploymentId,
        user._id,
      );
      expect(retrievedDeployment._id).toEqual(deploymentId);
      expect(retrievedDeployment.user._id).toEqual(user._id);
    });
  });

  describe('update', () => {
    const updateDeploymentDto: UpdateDeploymentDto = {
      name: 'New Test Deployment',
      properties: {
        resources: {
          cpuCount: 2,
          memoryCount: 4,
        },
      },
    };
    it('should throw an error if the deployment with the given id was not found', async () => {
      const deploymentId = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new DeploymentNotFoundException(
        deploymentId,
      ).message;
      try {
        await service.update(
          user._id,
          workspace._id,
          deploymentId,
          updateDeploymentDto,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the deployment status is not running', async () => {
      const expectedErrorMessage: string = new DeploymentNotRunningException(
        deploymentId,
      ).message;
      try {
        await service.update(
          user._id,
          workspace._id,
          deploymentId,
          updateDeploymentDto,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the deployment', async () => {
      // Update the deployment status to running
      await service.updateStatus(deploymentId, DeploymentStatus.Running);
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      const updatedDeployment: DeploymentDocument = await service.update(
        user._id,
        workspace._id,
        deploymentId,
        updateDeploymentDto,
      );
      expect(updatedDeployment._id).toEqual(deploymentId);
      expect(updatedDeployment.user._id).toEqual(user._id);
      expect(updatedDeployment.workspace._id).toEqual(workspace._id);
      expect(updatedDeployment.name).toBe(updateDeploymentDto.name);
      expect(updatedDeployment.properties.resources.cpuCount).toBe(
        updateDeploymentDto.properties.resources.cpuCount,
      );
      expect(updatedDeployment.properties.resources.memoryCount).toBe(
        updateDeploymentDto.properties.resources.memoryCount,
      );
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });

    it('should not emit the deployment.updated event if only the deployment name was updated', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      eventEmitterSpy.mockClear();
      const updateDeploymentDto: UpdateDeploymentDto = {
        name: 'New Test Deployment',
      };
      await service.update(
        user._id,
        workspace._id,
        deploymentId,
        updateDeploymentDto,
      );
      expect(eventEmitterSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update the deployments status', async () => {
      const updatedStatus: DeploymentStatus = DeploymentStatus.Deleting;
      await service.updateStatus(deploymentId, updatedStatus);
      const retrievedDeployment = await service.findOne(
        deploymentId,
        user._id,
        workspace._id,
      );
      expect(retrievedDeployment.status).toBe(updatedStatus);
    });
  });

  describe('remove', () => {
    it('should throw an error if the deployment with the given id was not found', async () => {
      const deploymentId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new DeploymentNotFoundException(
        deploymentId,
      ).message;
      try {
        await service.remove(user._id, workspace._id, deploymentId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the deployment', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      eventEmitterSpy.mockClear();
      await service.remove(user._id, workspace._id, deploymentId);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
