import { WikiPageNotFoundException } from './../../../exceptions/wiki-page-not-found.exception';
import { WikiSectionDocument } from '../../wiki/sections/schemas/section.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { WikiPage } from './schemas/page.schema';
import { WikiSectionDeletedEvent } from './../../../events/wiki-section-deleted.event';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from '../../../events/events.enum';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { UpdateWikiPageDto } from './dto/update-page.dto';
import { WikiPageDocument } from './schemas/page.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Query } from 'mongoose';

@Injectable()
export class WikiPagesService {
  constructor(
    @InjectModel(WikiPage.name)
    private readonly wikiPageModel: Model<WikiPageDocument>,
  ) {}

  /**
   * Create a wiki page
   * @param user the user
   * @param workspace the workspace
   * @param wikiSection the wiki section to create the wiki page in
   * @param createWikiPageDto the wiki page to create
   */
  async create(
    user: UserDocument,
    workspace: WorkspaceDocument,
    wikiSection: WikiSectionDocument,
    createWikiPageDto: CreateWikiPageDto,
  ): Promise<WikiPageDocument> {
    const wikiPage: WikiPage = new WikiPage(createWikiPageDto);
    wikiPage.user = user;
    wikiPage.workspace = workspace;
    wikiPage.section = wikiSection;
    const createdWikiPage: WikiPageDocument = await this.wikiPageModel.create(
      wikiPage,
    );
    return createdWikiPage;
  }

  /**
   * Find all wiki pages
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param userId the users id
   */
  async findAll(
    workspaceId: string,
    wikiSectionId: string,
    userId?: string,
  ): Promise<WikiPageDocument[]> {
    let wikiPagesQuery: Query<
      WikiPageDocument[],
      WikiPageDocument
    > = this.wikiPageModel
      .find()
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId);
    if (userId) {
      wikiPagesQuery = wikiPagesQuery.where('user').equals(userId);
    }
    const wikiPages: WikiPageDocument[] = await wikiPagesQuery.exec();
    return wikiPages;
  }

  /**
   * Find a wiki page
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   * @param userId the users id
   */
  async findOne(
    workspaceId: string,
    wikiSectionId: string,
    wikiPageId: string,
    userId?: string,
  ): Promise<WikiPageDocument> {
    let wikiPageQuery: Query<
      WikiPageDocument,
      WikiPageDocument
    > = this.wikiPageModel
      .findOne()
      .where('_id')
      .equals(wikiPageId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId);
    if (userId) {
      wikiPageQuery = wikiPageQuery.where('user').equals(userId);
    }
    const wikiPage: WikiPageDocument = await wikiPageQuery.exec();
    if (!wikiPage) throw new WikiPageNotFoundException(wikiPageId);
    return wikiPage;
  }

  /**
   * Update a wiki page
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   * @param updateWikiPageDto the updated wiki page
   * @param userId the users id
   */
  async update(
    workspaceId: string,
    wikiSectionId: string,
    wikiPageId: string,
    updateWikiPageDto: UpdateWikiPageDto,
    userId?: string,
  ): Promise<WikiPageDocument> {
    let wikiPageQuery: Query<
      WikiPageDocument,
      WikiPageDocument
    > = this.wikiPageModel
      .findOneAndUpdate(null, updateWikiPageDto, { new: true })
      .where('_id')
      .equals(wikiPageId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId);
    if (userId) {
      wikiPageQuery = wikiPageQuery.where('user').equals(userId);
    }
    const wikiPage: WikiPageDocument = await wikiPageQuery.exec();
    if (!wikiPage) throw new WikiPageNotFoundException(wikiPageId);
    return wikiPage;
  }

  /**
   * Delete a wiki page
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   * @param userId the users id
   */
  async remove(
    workspaceId: string,
    wikiSectionId: string,
    wikiPageId: string,
    userId?: string,
  ): Promise<void> {
    let wikiPageQuery: Query<
      WikiPageDocument,
      WikiPageDocument
    > = this.wikiPageModel
      .findOneAndDelete()
      .where('_id')
      .equals(wikiPageId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId);
    if (userId) {
      wikiPageQuery = wikiPageQuery.where('user').equals(userId);
    }
    const wikiPage: WikiPageDocument = await wikiPageQuery.exec();
    if (!wikiPage) throw new WikiPageNotFoundException(wikiPageId);
  }

  /**
   * Delete all wiki pages
   * @param wikiSectionId the wiki section id
   */
  private async removeAll(wikiSectionId: string): Promise<void> {
    await this.wikiPageModel
      .deleteMany()
      .where('section')
      .equals(wikiSectionId)
      .exec();
  }

  /**
   * handles the wiki.section.deleted event
   * @param payload the wiki.section.deleted event payload
   */
  @OnEvent(Event.WikiSectionDeleted)
  private async handleWikiSectionDeletedEvent(
    payload: WikiSectionDeletedEvent,
  ): Promise<void> {
    await this.removeAll(payload.id);
  }
}
