import { ShortcutNotFoundException } from './../../exceptions/shortcut-not-found.exception';
import { CreateShortcutDto, UpdateShortcutDto } from '@agoracloud/common';
import {
  Shortcut,
  ShortcutSchema,
  ShortcutDocument,
} from './schemas/shortcut.schema';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import {
  MongooseMockModule,
  closeMongooseConnection,
} from './../../../test/utils/mongoose-mock-module';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { Test, TestingModule } from '@nestjs/testing';
import { ShortcutsService } from './shortcuts.service';
import { Connection, Types } from 'mongoose';

const user: UserDocument = {
  _id: Types.ObjectId(),
  fullName: 'Test User',
  email: 'test@test.com',
  password: 'Password123',
  isEnabled: true,
  isVerified: true,
} as UserDocument;

const workspace: WorkspaceDocument = {
  _id: Types.ObjectId(),
  name: 'Test Workspace',
  users: [user],
} as WorkspaceDocument;

let shortcutId: string;

describe('ShortcutsService', () => {
  let service: ShortcutsService;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseMockModule({
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          { name: Shortcut.name, schema: ShortcutSchema },
        ]),
      ],
      providers: [ShortcutsService],
    }).compile();

    service = module.get<ShortcutsService>(ShortcutsService);
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
    it('should create a shortcut', async () => {
      const createShortcutDto: CreateShortcutDto = {
        title: 'Shortcut Test',
        link: 'https://test.com',
      };
      const createdShortcut: ShortcutDocument = await service.create(
        user,
        workspace,
        createShortcutDto,
      );
      expect(createdShortcut.title).toBe(createShortcutDto.title);
      expect(createdShortcut.link).toBe(createShortcutDto.link);
      shortcutId = createdShortcut._id;
    });
  });

  describe('findAll', () => {
    it('should find all shortcuts in the given workspace', async () => {
      const retrievedShortcuts: ShortcutDocument[] = await service.findAll(
        workspace._id,
      );
      expect(retrievedShortcuts).toBeTruthy();
      expect(retrievedShortcuts).toHaveLength(1);
      expect(retrievedShortcuts[0].workspace._id).toEqual(workspace._id);
    });

    it('should find all shortcuts in the given workspace for the given user', async () => {
      const retrievedShortcuts: ShortcutDocument[] = await service.findAll(
        workspace._id,
        user._id,
      );
      expect(retrievedShortcuts).toBeTruthy();
      expect(retrievedShortcuts).toHaveLength(1);
      expect(retrievedShortcuts[0].user._id).toEqual(user._id);
      expect(retrievedShortcuts[0].workspace._id).toEqual(workspace._id);
    });
  });

  describe('findOne', () => {
    it('should throw an error if the shortcut with the given id was not found', async () => {
      const shortcutId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ShortcutNotFoundException(
        shortcutId,
      ).message;
      try {
        await service.findOne(workspace._id, shortcutId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should find the shortcut in the given workspace for the given user', async () => {
      const retrievedShortcut: ShortcutDocument = await service.findOne(
        workspace._id,
        shortcutId,
        user._id,
      );
      expect(retrievedShortcut._id).toEqual(shortcutId);
      expect(retrievedShortcut.user._id).toEqual(user._id);
      expect(retrievedShortcut.workspace._id).toEqual(workspace._id);
    });
  });

  describe('update', () => {
    const updateShortcutDto: UpdateShortcutDto = {
      title: 'New Shortcut Test',
      link: 'https://new.test.com',
    };
    it('should throw an error if the shortcut with the given id was not found', async () => {
      const shortcutId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ShortcutNotFoundException(
        shortcutId,
      ).message;
      try {
        await service.update(
          workspace._id,
          shortcutId,
          updateShortcutDto,
          user._id,
        );
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should update the shortcut', async () => {
      const updatedShortcut: ShortcutDocument = await service.update(
        workspace._id,
        shortcutId,
        updateShortcutDto,
        user._id,
      );
      expect(updatedShortcut._id).toEqual(shortcutId);
      expect(updatedShortcut.title).toBe(updateShortcutDto.title);
      expect(updatedShortcut.link).toBe(updateShortcutDto.link);
    });
  });

  describe('remove', () => {
    it('should throw an error if the shortcut with the given id was not found', async () => {
      const shortcutId: string = Types.ObjectId().toHexString();
      const expectedErrorMessage: string = new ShortcutNotFoundException(
        shortcutId,
      ).message;
      try {
        await service.remove(workspace._id, shortcutId, user._id);
        fail('It should throw an error');
      } catch (err) {
        expect(err.message).toBe(expectedErrorMessage);
      }
    });

    it('should delete the shortcut', async () => {
      await service.remove(workspace._id, shortcutId, user._id);
      // Verify that the shortcut has been deleted by retrieving all shortcuts
      const retrievedShortcuts: ShortcutDocument[] = await service.findAll(
        workspace.id,
        user.id,
      );
      expect(retrievedShortcuts).toHaveLength(0);
    });
  });
});
