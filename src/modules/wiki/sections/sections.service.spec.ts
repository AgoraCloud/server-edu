import { UpdateWikiSectionDto } from './dto/update-section.dto';
import { WikiSectionNotFoundException } from './../../../exceptions/wiki-section-not-found.exception';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { CreateWikiSectionDto } from './dto/create-section.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  WikiSection,
  WikiSectionSchema,
  WikiSectionDocument,
} from './schemas/section.schema';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../../test/utils/mongoose-mock-module';
import { Test, TestingModule } from '@nestjs/testing';
import { WikiSectionsService } from './sections.service';
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

let wikiSectionId: string;

describe('WikiSectionsService', () => {
  let service: WikiSectionsService;
  let connection: Connection;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: WikiSection.name, schema: WikiSectionSchema },
        ]),
      ],
      providers: [WikiSectionsService, EventEmitter2],
    }).compile();

    service = module.get<WikiSectionsService>(WikiSectionsService);
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
    it('should create a wiki section', async () => {
      const createWikiSectionDto: CreateWikiSectionDto = {
        name: 'Wiki Section',
      };
      const createdWikiSection: WikiSectionDocument = await service.create(
        user,
        workspace,
        createWikiSectionDto,
      );
      expect(createdWikiSection.name).toBe(createWikiSectionDto.name);
      wikiSectionId = createdWikiSection._id;
    });
  });

  describe('findAll', () => {
    it('should find all wiki sections in the given workspace', async () => {
      const retrievedWikiSections: WikiSectionDocument[] = await service.findAll(
        workspace._id,
      );
      expect(retrievedWikiSections).toBeTruthy();
      expect(retrievedWikiSections[0].workspace._id).toEqual(workspace._id);
    });

    it('should find all wiki sections in the given workspace for the given user', async () => {
      const retrievedWikiSections: WikiSectionDocument[] = await service.findAll(
        workspace._id,
        user._id,
      );
      expect(retrievedWikiSections).toBeTruthy();
      expect(retrievedWikiSections[0].workspace._id).toEqual(workspace._id);
      expect(retrievedWikiSections[0].user._id).toEqual(user._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the wiki section with the given id was not found', async () => {
      const wikiSectionId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WikiSectionNotFoundException(
        wikiSectionId,
      ).message;
      try {
        await service.findOne(workspace._id, wikiSectionId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the wiki section in the given workspace for the given user', async () => {
      const retrievedWikiSection: WikiSectionDocument = await service.findOne(
        workspace._id,
        wikiSectionId,
        user._id,
      );
      expect(retrievedWikiSection._id).toEqual(wikiSectionId);
      expect(retrievedWikiSection.user._id).toEqual(user._id);
      expect(retrievedWikiSection.workspace._id).toEqual(workspace._id);
    });
  });

  describe('Update', () => {
    const updateWikiSectionDto: UpdateWikiSectionDto = {
      name: 'New Wiki Section',
    };
    it('should throw an error if the wiki section with the given id was not found', async () => {
      const wikiSectionId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WikiSectionNotFoundException(
        wikiSectionId,
      ).message;
      try {
        await service.update(
          workspace._id,
          wikiSectionId,
          updateWikiSectionDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the wiki section', async () => {
      const updatedWikiSection: WikiSectionDocument = await service.update(
        workspace._id,
        wikiSectionId,
        updateWikiSectionDto,
        user._id,
      );
      expect(updatedWikiSection._id).toEqual(wikiSectionId);
      expect(updatedWikiSection.name).toBe(updateWikiSectionDto.name);
    });
  });

  describe('remove', () => {
    it('should throw an error if the wiki section with the given id was not found', async () => {
      const wikiSectionId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WikiSectionNotFoundException(
        wikiSectionId,
      ).message;
      try {
        await service.remove(workspace._id, wikiSectionId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the wiki section', async () => {
      const eventEmitterSpy: jest.SpyInstance<boolean, any[]> = jest.spyOn(
        eventEmitter,
        'emit',
      );
      await service.remove(workspace._id, wikiSectionId, user._id);
      expect(eventEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });
});
