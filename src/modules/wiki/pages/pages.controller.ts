import { WikiPageDto } from './dto/page.dto';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
import { WorkspaceInterceptor } from './../../../interceptors/workspace.interceptor';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WikiPagesService } from './pages.service';
import { CreateWikiPageDto } from './dto/create-page.dto';
import { UpdateWikiPageDto } from './dto/update-page.dto';
import { JwtAuthenticationGuard } from 'src/modules/authentication/guards/jwt-authentication.guard';

@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/sections/:sectionId/pages')
// TODO: add the sections interceptor when it is created
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(WikiPageDto))
export class WikiPagesController {
  constructor(private readonly wikiPagesService: WikiPagesService) {}

  @Post()
  create(@Body() createWikiPageDto: CreateWikiPageDto) {
    return this.wikiPagesService.create(createWikiPageDto);
  }

  @Get()
  findAll() {
    return this.wikiPagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wikiPagesService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateWikiPageDto: UpdateWikiPageDto,
  ) {
    return this.wikiPagesService.update(+id, updateWikiPageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wikiPagesService.remove(+id);
  }
}
