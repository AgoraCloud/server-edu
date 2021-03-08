import { WikiSectionDeletedEvent } from './../../../events/wiki-section-deleted.event';
import { WikiSectionNotFoundException } from './../../../exceptions/wiki-section-not-found.exception';
import { WorkspaceUserRemovedEvent } from './../../../events/workspace-user-removed.event';
import { WorkspaceDeletedEvent } from './../../../events/workspace-deleted.event';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { WikiSection, WikiSectionDocument } from './schemas/section.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateWikiSectionDto } from './dto/create-section.dto';
import { UpdateWikiSectionDto } from './dto/update-section.dto';
import { Model, Query } from 'mongoose';
import { Event } from '../../../events/events.enum';

@Injectable()
export class WikiSectionsService {
  constructor(
    @InjectModel(WikiSection.name)
    private readonly wikiSectionModel: Model<WikiSectionDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a wiki section
   * @param user the user
   * @param workspace the workspace
   * @param createWikiSectionDto the wiki section to create
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    createWikiSectionDto: CreateWikiSectionDto,
  ): Promise<WikiSectionDocument> {
    const wikiSection: WikiSection = new WikiSection(createWikiSectionDto);
    wikiSection.user = user;
    wikiSection.workspace = workspace;
    const createdWikiSection: WikiSectionDocument = await this.wikiSectionModel.create(
      wikiSection,
    );
    return createdWikiSection;
  }

  /**
   * Find all wiki sections
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  async findAll(
    workspaceId: string,
    userId?: string,
  ): Promise<WikiSectionDocument[]> {
    let wikiSectionsQuery: Query<
      WikiSectionDocument[],
      WikiSectionDocument
    > = this.wikiSectionModel.find().where('workspace').equals(workspaceId);
    if (userId) {
      wikiSectionsQuery = wikiSectionsQuery.where('user').equals(userId);
    }
    const wikiSections: WikiSectionDocument[] = await wikiSectionsQuery.exec();
    return wikiSections;
  }

  /**
   * Find a wiki section
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param userId the users id
   */
  async findOne(
    workspaceId: string,
    wikiSectionId: string,
    userId?: string,
  ): Promise<WikiSectionDocument> {
    let wikiSectionQuery: Query<
      WikiSectionDocument,
      WikiSectionDocument
    > = this.wikiSectionModel
      .findOne()
      .where('_id')
      .equals(wikiSectionId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      wikiSectionQuery = wikiSectionQuery.where('user').equals(userId);
    }
    const wikiSection: WikiSectionDocument = await wikiSectionQuery.exec();
    if (!wikiSection) throw new WikiSectionNotFoundException(wikiSectionId);
    return wikiSection;
  }

  /**
   * Update a wiki section
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param updateWikiSectionDto the updated wiki section
   * @param userId the users id
   */
  async update(
    workspaceId: string,
    wikiSectionId: string,
    updateWikiSectionDto: UpdateWikiSectionDto,
    userId?: string,
  ): Promise<WikiSectionDocument> {
    let wikiSectionQuery: Query<
      WikiSectionDocument,
      WikiSectionDocument
    > = this.wikiSectionModel
      .findOneAndUpdate(null, updateWikiSectionDto, { new: true })
      .where('_id')
      .equals(wikiSectionId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      wikiSectionQuery = wikiSectionQuery.where('user').equals(userId);
    }
    const wikiSection: WikiSectionDocument = await wikiSectionQuery.exec();
    if (!wikiSection) throw new WikiSectionNotFoundException(wikiSectionId);
    return wikiSection;
  }

  /**
   * Delete a wiki section
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param userId the users id
   */
  async remove(
    workspaceId: string,
    wikiSectionId: string,
    userId?: string,
  ): Promise<void> {
    let wikiSectionQuery: Query<
      WikiSectionDocument,
      WikiSectionDocument
    > = this.wikiSectionModel
      .findOneAndDelete()
      .where('_id')
      .equals(wikiSectionId)
      .where('workspace')
      .equals(workspaceId);
    if (userId) {
      wikiSectionQuery = wikiSectionQuery.where('user').equals(userId);
    }
    const wikiSection: WikiSectionDocument = await wikiSectionQuery.exec();
    if (!wikiSection) throw new WikiSectionNotFoundException(wikiSectionId);
    this.eventEmitter.emit(
      Event.WikiSectionDeleted,
      new WikiSectionDeletedEvent(wikiSectionId),
    );
  }

  /**
   * Delete all wiki sections
   * @param workspaceId the workspace id
   * @param userId the users id
   */
  private async removeAll(workspaceId: string, userId?: string): Promise<void> {
    const wikiSections: WikiSectionDocument[] = await this.findAll(
      workspaceId,
      userId,
    );
    const wikiSectionIds: string[] = wikiSections.map((ws) => ws._id);
    await this.wikiSectionModel
      .deleteMany()
      .where('_id')
      .in(wikiSectionIds)
      .exec();
    wikiSectionIds.forEach((wikiSectionId: string) => {
      this.eventEmitter.emit(
        Event.WikiSectionDeleted,
        new WikiSectionDeletedEvent(wikiSectionId),
      );
    });
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
