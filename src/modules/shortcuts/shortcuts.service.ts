import { OnEvent } from '@nestjs/event-emitter';
import { WorkspaceUserRemovedEvent } from './../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../events/workspace-deleted.event';
import { WorkspaceDocument } from './../workspaces/schemas/workspace.schema';
import { UserDocument } from './../users/schemas/user.schema';
import { CreateShortcutDto, UpdateShortcutDto } from '@agoracloud/common';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Shortcut, ShortcutDocument } from './schemas/shortcut.schema';
import { Model } from 'mongoose';
import { Event } from 'src/events/events.enum';

@Injectable()
export class ShortcutsService {
  constructor(
    @InjectModel(Shortcut.name)
    private readonly shortcutModel: Model<ShortcutDocument>,
  ) {}

  create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    createShortcutDto: CreateShortcutDto,
  ): Promise<ShortcutDocument> {
    return;
  }

  findAll(worksapceId: string, userId?: string): Promise<ShortcutDocument[]> {
    return;
  }

  findOne(
    workspaceId: string,
    shortcutId: string,
    userId?: string,
  ): Promise<ShortcutDocument> {
    return;
  }

  update(
    workspaceId: string,
    shortcutId: string,
    updateShortcutDto: UpdateShortcutDto,
    userId?: string,
  ): Promise<ShortcutDocument> {
    return;
  }

  remove(
    workspaceId: string,
    shortcutId: string,
    userId?: string,
  ): Promise<void> {
    return;
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
