import { UpdateWikiPageDto } from './dto/update-page.dto';
import { WikiPageNotFoundException } from './../../../exceptions/wiki-page-not-found.exception';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { WikiSectionDocument } from './../sections/schemas/section.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import {
  WikiPage,
  WikiPageDocument,
  WikiPageSchema,
} from './schemas/page.schema';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import {
  closeMongooseConnection,
  MongooseMockModule,
} from './../../../../test/utils/mongoose-mock-module';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Types } from 'mongoose';
import { WikiPagesService } from './pages.service';

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

const wikiSection: WikiSectionDocument = {
  _id: Types.ObjectId(),
  name: 'Wiki Section',
  workspace,
  user,
} as WikiSectionDocument;

let wikiPageId: string;

describe('WikiPagesService', () => {
  let service: WikiPagesService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: WikiPage.name, schema: WikiPageSchema },
        ]),
      ],
      providers: [WikiPagesService],
    }).compile();

    service = module.get<WikiPagesService>(WikiPagesService);
    connection = await module.get(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await closeMongooseConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a wiki page', async () => {
      const createWikiPageDto: CreateWikiPageDto = {
        title: 'Wiki Page',
        body: 'Wiki page body',
      };
      const createdWikiPage: WikiPageDocument = await service.create(
        user,
        workspace,
        wikiSection,
        createWikiPageDto,
      );
      expect(createdWikiPage.title).toBe(createWikiPageDto.title);
      expect(createdWikiPage.body).toBe(createWikiPageDto.body);
      wikiPageId = createdWikiPage._id;
    });
  });

  describe('findAll', () => {
    it('should find all wiki pages in the given workspace and wiki section for the given user', async () => {
      const retrievedWikiPages: WikiPageDocument[] = await service.findAll(
        workspace._id,
        wikiSection._id,
        user._id,
      );
      expect(retrievedWikiPages).toBeTruthy();
      expect(retrievedWikiPages[0].user._id).toEqual(user._id);
      expect(retrievedWikiPages[0].workspace._id).toEqual(workspace._id);
      expect(retrievedWikiPages[0].section._id).toEqual(wikiSection._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the wiki page with the given id was not found', async () => {
      const wikiPageId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WikiPageNotFoundException(
        wikiPageId,
      ).message;
      try {
        await service.findOne(
          workspace._id,
          wikiSection._id,
          wikiPageId,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the wiki page in the given workspace and wiki section for the given user', async () => {
      const retrievedWikiPage: WikiPageDocument = await service.findOne(
        workspace._id,
        wikiSection._id,
        wikiPageId,
        user._id,
      );
      expect(retrievedWikiPage._id).toEqual(wikiPageId);
      expect(retrievedWikiPage.user._id).toEqual(user._id);
      expect(retrievedWikiPage.workspace._id).toEqual(workspace._id);
      expect(retrievedWikiPage.section._id).toEqual(wikiSection._id);
    });
  });

  describe('Update', () => {
    const updateWikiPageDto: UpdateWikiPageDto = {
      title: 'New Wiki Page',
      body: 'New wiki page body',
    };
    it('should throw an error if the wiki page with the given id was not found', async () => {
      const wikiPageId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WikiPageNotFoundException(
        wikiPageId,
      ).message;
      try {
        await service.update(
          workspace._id,
          wikiSection._id,
          wikiPageId,
          updateWikiPageDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the wiki page', async () => {
      const updatedWikiPage: WikiPageDocument = await service.update(
        workspace._id,
        wikiSection._id,
        wikiPageId,
        updateWikiPageDto,
        user._id,
      );
      expect(updatedWikiPage._id).toEqual(wikiPageId);
      expect(updatedWikiPage.title).toBe(updateWikiPageDto.title);
      expect(updatedWikiPage.body).toBe(updateWikiPageDto.body);
    });
  });

  describe('remove', () => {
    it('should throw an error if the wiki page with the given id was not found', async () => {
      const wikiPageId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new WikiPageNotFoundException(
        wikiPageId,
      ).message;
      try {
        await service.remove(
          workspace._id,
          wikiSection._id,
          wikiPageId,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the wiki page', async () => {
      await service.remove(
        workspace._id,
        wikiSection._id,
        wikiPageId,
        user._id,
      );
      // Make sure that the wiki page has been deleted
      const retrievedWikiPages: WikiPageDocument[] = await service.findAll(
        workspace._id,
        wikiSection._id,
        user._id,
      );
      expect(retrievedWikiPages.length).toBe(0);
    });
  });
});
