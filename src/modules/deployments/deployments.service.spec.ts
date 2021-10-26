import { DateUtil } from './../../utils/date.util';
import { ProxyUtil } from './../proxy/utils/proxy.util';
import { DeploymentVersionCanNotBeUpgradedException } from './../../exceptions/deployment-version-can-not-be-upgraded.exception';
import { InvalidDeploymentVersionUpgradeException } from './../../exceptions/invalid-deployment-version-upgrade.exception';
import { DeploymentTypeMismatchException } from './../../exceptions/deployment-type-mismatch.exception';
import { DeploymentCannotBeUpdatedException } from '../../exceptions/deployment-cannot-be-updated.exception';
import { DeploymentNotFoundException } from './../../exceptions/deployment-not-found.exception';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from '../users/schemas/user.schema';
import {
  DeploymentSchema,
  DeploymentImage,
  DeploymentDocument,
  Deployment,
} from './schemas/deployment.schema';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, Model, Types } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentsService } from './deployments.service';
import {
  CreateDeploymentDto,
  DeploymentStatusDto,
  UpdateDeploymentDto,
  DEPLOYMENT_IMAGES_DTO,
  DeploymentVersionDto,
  DeploymentTypeDto,
  DeploymentScalingMethodDto,
} from '@agoracloud/common';
import { ConfigService } from '@nestjs/config';

const domainConfig = 'agoracloud.test.com';

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

let deployment: DeploymentDocument;

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;
  let deploymentsModel: Model<DeploymentDocument>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: Deployment.name, schema: DeploymentSchema },
        ]),
      ],
      providers: [
        DeploymentsService,
        {
          provide: ConfigService,
          useValue: {
            get(key: string) {
              switch (key) {
                case 'domain': {
                  return domainConfig;
                }
              }
            },
          },
        },
        EventEmitter2,
      ],
    }).compile();

    service = module.get<DeploymentsService>(DeploymentsService);
    connection = await module.get(getConnectionToken());
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    deploymentsModel = module.get<Model<DeploymentDocument>>(
      getModelToken(Deployment.name),
    );
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a deployment', async () => {
      const createDeploymentDto: CreateDeploymentDto = {
        name: 'Test Deployment',
        properties: {
          isFavorite: true,
          scalingMethod: DeploymentScalingMethodDto.OnDemand,
          sudoPassword: 'Sudo Password',
          image: {
            type: DeploymentTypeDto.VSCode,
            version: DeploymentVersionDto.VSCode_3_9_3,
          },
          resources: {
            cpuCount: 1,
            memoryCount: 2,
            storageCount: 8,
          },
        },
      };
      const createdDeployment: DeploymentDocument = await service.create(
        user,
        workspace,
        createDeploymentDto,
      );
      const expectedProxyUrl: string = ProxyUtil.generatePublicProxyUrl(
        domainConfig,
        createdDeployment._id,
      );
      expect(createdDeployment.name).toBe(createDeploymentDto.name);
      expect(createdDeployment.properties.isFavorite).toBe(
        createDeploymentDto.properties.isFavorite,
      );
      expect(createdDeployment.properties.scalingMethod).toBe(
        createDeploymentDto.properties.scalingMethod,
      );
      expect(createdDeployment.properties.proxyUrl).toBe(expectedProxyUrl);
      expect(createdDeployment.properties.image.type).toBe(
        createDeploymentDto.properties.image.type,
      );
      expect(createdDeployment.properties.image.version).toBe(
        createDeploymentDto.properties.image.version,
      );
      expect(createdDeployment.properties.resources.cpuCount).toBe(
        createDeploymentDto.properties.resources.cpuCount,
      );
      expect(createdDeployment.properties.resources.memoryCount).toBe(
        createDeploymentDto.properties.resources.memoryCount,
      );
      expect(createdDeployment.properties.resources.storageCount).toBe(
        createDeploymentDto.properties.resources.storageCount,
      );
      deployment = createdDeployment;
    });
  });

  describe('findAllImages', () => {
    it('should find all deployment images', () => {
      const retrievedDeploymentImages: DeploymentImage[] =
        service.findAllImages();
      expect(retrievedDeploymentImages).toBe(DEPLOYMENT_IMAGES_DTO);
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

  describe('findAllInactive', () => {
    beforeAll(async () => {
      /**
       * Manually update the current deployments status and lastActivateAt date to test the
       * findAllInactive() method
       */
      await deploymentsModel
        .updateOne(
          { _id: deployment._id },
          {
            status: DeploymentStatusDto.Running,
            internalProperties: {
              isCurrentlyInUse: false,
              lastActiveAt: DateUtil.removeMinutes(new Date(), 16),
            },
          },
        )
        .exec();
    });

    afterAll(async () => {
      // Restore the deployments status to PENDING
      await deploymentsModel
        .updateOne(
          { _id: deployment._id },
          {
            status: DeploymentStatusDto.Pending,
          },
        )
        .exec();
    });

    it('should find all inactive deployments', async () => {
      const inactiveDeployments: DeploymentDocument[] =
        await service.findAllInactive();
      expect(inactiveDeployments).toHaveLength(1);
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
        deployment._id,
        user._id,
        workspace._id,
      );
      expect(retrievedDeployment._id).toEqual(deployment._id);
      expect(retrievedDeployment.workspace._id).toEqual(workspace._id);
      expect(retrievedDeployment.user._id).toEqual(user._id);
    });

    it('should find the deployment for the given user', async () => {
      const retrievedDeployment: DeploymentDocument = await service.findOne(
        deployment._id,
        user._id,
      );
      expect(retrievedDeployment._id).toEqual(deployment._id);
      expect(retrievedDeployment.user._id).toEqual(user._id);
    });
  });

  describe('getStatus', () => {
    it('should throw an error if the deployment with the given id was not found', async () => {
      const deploymentId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new DeploymentNotFoundException(
        deploymentId,
      ).message;
      try {
        await service.getStatus(deploymentId);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should get the status of the deployment with the given id', async () => {
      const deploymentStatus: DeploymentStatusDto = await service.getStatus(
        deployment._id,
      );
      expect(deploymentStatus).toBe(deployment.status);
    });
  });

  describe('update', () => {
    let updateDeploymentDto: UpdateDeploymentDto;

    beforeAll(() => {
      updateDeploymentDto = {
        name: 'New Test Deployment',
        properties: {
          image: {
            type: deployment.properties.image.type,
            version: DeploymentVersionDto.VSCode_3_10_2,
          },
          resources: {
            cpuCount: 2,
            memoryCount: 4,
          },
        },
      };
    });

    it('should throw an error if the deployment with the given id was not found', async () => {
      const deploymentId = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new DeploymentNotFoundException(
        deploymentId,
      ).message;
      try {
        await service.update(
          workspace._id,
          deploymentId,
          updateDeploymentDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the deployment status is not running or failed', async () => {
      const expectedErrorMessage: string =
        new DeploymentCannotBeUpdatedException(deployment._id).message;
      try {
        await service.update(
          workspace._id,
          deployment._id,
          updateDeploymentDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      } finally {
        // Update the deployment status to running
        await service.updateStatus(deployment._id, DeploymentStatusDto.Running);
      }
    });

    it('should throw an error if the given deployment type does not match the deployments original type', async () => {
      const updateDeploymentDto: UpdateDeploymentDto = {
        properties: {
          image: {
            type: DeploymentTypeDto.Ubuntu,
            version: deployment.properties.image.version,
          },
        },
      };
      const expectedErrorMessage: string = new DeploymentTypeMismatchException(
        deployment._id,
        deployment.properties.image.type,
        updateDeploymentDto.properties.image.type,
      ).message;
      try {
        await service.update(
          workspace._id,
          deployment._id,
          updateDeploymentDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the given deployment version is older than the deployments current version', async () => {
      const updateDeploymentDto: UpdateDeploymentDto = {
        properties: {
          image: {
            type: deployment.properties.image.type,
            version: DeploymentVersionDto.VSCode_3_9_0,
          },
        },
      };
      const expectedErrorMessage: string =
        new InvalidDeploymentVersionUpgradeException(
          deployment._id,
          deployment.properties.image.version,
          updateDeploymentDto.properties.image.version,
        ).message;
      try {
        await service.update(
          workspace._id,
          deployment._id,
          updateDeploymentDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should throw an error if the version of any deployment with type UBUNTU is changed', async () => {
      // Create a new UBUNTU deployment
      const createDeploymentDto: CreateDeploymentDto = {
        name: 'Test Deployment',
        properties: {
          scalingMethod: DeploymentScalingMethodDto.AlwaysOn,
          image: {
            type: DeploymentTypeDto.Ubuntu,
            version: DeploymentVersionDto.Ubuntu_37fd85aa,
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
      // Update the deployment status to running
      await service.updateStatus(
        createdDeployment._id,
        DeploymentStatusDto.Running,
      );

      // At the time of writing, there is only one version for UBUNTU deployments, hence the cast to any
      const updateDeploymentDto: UpdateDeploymentDto = {
        properties: {
          image: {
            type: createDeploymentDto.properties.image.type,
            version: 'new_version',
          },
        },
      } as any;
      const expectedErrorMessage: string =
        new DeploymentVersionCanNotBeUpgradedException(
          createdDeployment._id,
          createDeploymentDto.properties.image.type,
        ).message;
      try {
        await service.update(
          workspace._id,
          createdDeployment._id,
          updateDeploymentDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }

      // Delete the UBUNTU deployment
      await service.remove(workspace._id, createdDeployment._id, user._id);
    });

    it('should update the deployment', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      const updatedDeployment: DeploymentDocument = await service.update(
        workspace._id,
        deployment._id,
        updateDeploymentDto,
        user._id,
      );
      expect(updatedDeployment._id).toEqual(deployment._id);
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
        workspace._id,
        deployment._id,
        updateDeploymentDto,
        user._id,
      );
      expect(eventEmitterSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update the deployments status', async () => {
      const updatedStatus: DeploymentStatusDto = DeploymentStatusDto.Deleting;
      await service.updateStatus(deployment._id, updatedStatus);
      const retrievedDeployment = await service.findOne(
        deployment._id,
        user._id,
        workspace._id,
      );
      expect(retrievedDeployment.status).toBe(updatedStatus);
    });
  });

  describe('updateUsageStatus', () => {
    it('should update the deployments usage status', async () => {
      const updatedUsageStatus = false;
      await service.updateUsageStatus(deployment._id, updatedUsageStatus);
      const retrievedDeployment = await service.findOne(
        deployment._id,
        user._id,
        workspace._id,
      );
      expect(retrievedDeployment.internalProperties.isCurrentlyInUse).toBe(
        updatedUsageStatus,
      );
    });
  });

  describe('remove', () => {
    it('should throw an error if the deployment with the given id was not found', async () => {
      const deploymentId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new DeploymentNotFoundException(
        deploymentId,
      ).message;
      try {
        await service.remove(workspace._id, deploymentId, user._id);
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
      await service.remove(workspace._id, deployment._id, user._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
