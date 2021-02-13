import { WikiPageNotFoundException } from './../../../exceptions/wiki-page-not-found.exception';
import { WikiSectionDocument } from 'src/modules/wiki/sections/schemas/section.schema';
import { WorkspaceDocument } from './../../workspaces/schemas/workspace.schema';
import { UserDocument } from './../../users/schemas/user.schema';
import { WikiPage } from './schemas/page.schema';
import { WikiSectionDeletedEvent } from './../../../events/wiki-section-deleted.event';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Event } from 'src/events/events.enum';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { UpdateWikiPageDto } from './dto/update-page.dto';
import { WikiPageDocument } from './schemas/page.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   */
  async findAll(
    userId: string,
    workspaceId: string,
    wikiSectionId: string,
  ): Promise<WikiPageDocument[]> {
    const wikiPages: WikiPageDocument[] = await this.wikiPageModel
      .find()
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId)
      .exec();
    return wikiPages;
  }

  /**
   * Find a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   */
  async findOne(
    userId: string,
    workspaceId: string,
    wikiSectionId: string,
    wikiPageId: string,
  ): Promise<WikiPageDocument> {
    const wikiPage: WikiPageDocument = await this.wikiPageModel
      .findOne()
      .where('_id')
      .equals(wikiPageId)
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId)
      .exec();
    if (!wikiPage) throw new WikiPageNotFoundException(wikiPageId);
    return wikiPage;
  }

  /**
   * Update a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   * @param updateWikiPageDto the updated wiki page
   */
  async update(
    userId: string,
    workspaceId: string,
    wikiSectionId: string,
    wikiPageId: string,
    updateWikiPageDto: UpdateWikiPageDto,
  ): Promise<WikiPageDocument> {
    const wikiPage: WikiPageDocument = await this.wikiPageModel
      .findOneAndUpdate(null, updateWikiPageDto, { new: true })
      .where('_id')
      .equals(wikiPageId)
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId)
      .exec();
    if (!wikiPage) throw new WikiPageNotFoundException(wikiPageId);
    return wikiPage;
  }

  /**
   * Delete a wiki page
   * @param userId the users id
   * @param workspaceId the workspace id
   * @param wikiSectionId the wiki section id
   * @param wikiPageId the wiki page id
   */
  async remove(
    userId: string,
    workspaceId: string,
    wikiSectionId: string,
    wikiPageId: string,
  ): Promise<void> {
    const wikiPage: WikiPageDocument = await this.wikiPageModel
      .findOneAndDelete()
      .where('_id')
      .equals(wikiPageId)
      .where('user')
      .equals(userId)
      .where('workspace')
      .equals(workspaceId)
      .where('section')
      .equals(wikiSectionId)
      .exec();
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
