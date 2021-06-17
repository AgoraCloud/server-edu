import { ShortcutNotFoundException } from './../../exceptions/shortcut-not-found.exception';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { CreateShortcutDto, UpdateShortcutDto } from '@agoracloud/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Shortcut, ShortcutDocument } from './schemas/shortcut.schema';
import { Model, Query } from 'mongoose';
import { Event } from '../../events/events.enum';

@Injectable()
export class ShortcutsService {
  constructor(
    @InjectModel(Shortcut.name)
    private readonly shortcutModel: Model<ShortcutDocument>,
  ) {}

  /**
   * create a shortcut
   * @param user the user
   * @param workspace the workspace
   * @param createShortcutDto the shortcut to create
   * @returns the created shortcut document
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    createShortcutDto: CreateShortcutDto,
  ): Promise<ShortcutDocument> {
    const shortcut: Shortcut = new Shortcut(createShortcutDto);
    shortcut.user = user;
    shortcut.workspace = workspace;
    const createdShortcut: ShortcutDocument = await this.shortcutModel.create(
      shortcut,
    );
    return createdShortcut;
  }

  /**
   * Find all shortcuts
   * @param workspaceId the workspace id
   * @param userId the users id
   * @returns an array of shortcut documents
   */
  async findAll(
    workspaceId: string,
    userId?: string,
  ): Promise<ShortcutDocument[]> {
    let shortcutsQuery: Query<ShortcutDocument[], ShortcutDocument> =
      this.shortcutModel.find().where('workspace').equals(workspaceId);
    if (userId) {
      shortcutsQuery = shortcutsQuery.where('user').equals(userId);
    }
    const shortcuts: ShortcutDocument[] = await shortcutsQuery.exec();
    return shortcuts;
  }

  /**
   * Find a shortcut
   * @param workspaceId the workspace id
   * @param shortcutId the shortcut id
   * @param userId the users id
   * @throws ShortcutNotFoundException
   * @returns a shortcut document
   */
  async findOne(
    workspaceId: string,
    shortcutId: string,
    userId?: string,
  ): Promise<ShortcutDocument> {
    let shortcutQuery: Query<ShortcutDocument, ShortcutDocument> =
      this.shortcutModel
        .findOne()
        .where('_id')
        .equals(shortcutId)
        .where('workspace')
        .equals(workspaceId);
    if (userId) {
      shortcutQuery = shortcutQuery.where('user').equals(userId);
    }
    const shortcut: ShortcutDocument = await shortcutQuery.exec();
    if (!shortcut) throw new ShortcutNotFoundException(shortcutId);
    return shortcut;
  }

  /**
   * Update a shortcut
   * @param workspaceId the workspace id
   * @param shortcutId the shortcut id
   * @param updateShortcutDto the updated shortcut
   * @param userId the users id
   * @throws ShortcutNotFoundException
   * @returns the updated shortcut document
   */
  async update(
    workspaceId: string,
    shortcutId: string,
    updateShortcutDto: UpdateShortcutDto,
    userId?: string,
  ): Promise<ShortcutDocument> {
    let shortcutQuery: Query<ShortcutDocument, ShortcutDocument> =
      this.shortcutModel
        .findOneAndUpdate(null, updateShortcutDto, { new: true })
        .where('_id')
        .equals(shortcutId)
        .where('workspace')
        .equals(workspaceId);
    if (userId) {
      shortcutQuery = shortcutQuery.where('user').equals(userId);
    }
    const shortcut: ShortcutDocument = await shortcutQuery.exec();
    if (!shortcut) throw new ShortcutNotFoundException(shortcutId);
    return shortcut;
  }

  /**
   * Delete a shortcut
   * @param workspaceId the workspace id
   * @param shortcutId the shortcut id
   * @param userId the user id
   */
  async remove(
    workspaceId: string,
    shortcutId: string,
    userId?: string,
  ): Promise<void> {
    let shortcutQuery: Query<ShortcutDocument, ShortcutDocument> =
      this.shortcutModel
        .findOneAndDelete()
        .where('_id')
        .equals(shortcutId)
        .where('workspace')
        .equals(workspaceId);
    if (userId) {
      shortcutQuery = shortcutQuery.where('user').equals(userId);
    }
    const shortcut: ShortcutDocument = await shortcutQuery.exec();
    if (!shortcut) throw new ShortcutNotFoundException(shortcutId);
  }

  /**
   * Delete all shortcuts
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  private async removeAll(workspaceId: string, userId?: string): Promise<void> {
    const shortcuts: ShortcutDocument[] = await this.findAll(
      workspaceId,
      userId,
    );
    const shortcutIds: string[] = shortcuts.map((p) => p._id);
    await this.shortcutModel.deleteMany().where('_id').in(shortcutIds).exec();
  }

  /**
   * Handles the workspace.deleted event
   * @param payload the workspace.deleted event payload
   */
  @OnEvent(Event.WorkspaceDeleted)
  private async handleWorkspaceDeletedEvent(
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
