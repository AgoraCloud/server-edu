import { WikiSectionDto } from './dto/section.dto';
import { TransformInterceptor } from './../../../interceptors/transform.interceptor';
import { JwtAuthenticationGuard } from './../../authentication/guards/jwt-authentication.guard';
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
import { WikiSectionsService } from './sections.service';
import { CreateWikiSectionDto } from './dto/create-section.dto';
import { UpdateWikiSectionDto } from './dto/update-section.dto';
import { WorkspaceInterceptor } from 'src/interceptors/workspace.interceptor';

@UseGuards(JwtAuthenticationGuard)
@Controller('api/workspaces/:workspaceId/sections')
@UseInterceptors(WorkspaceInterceptor, new TransformInterceptor(WikiSectionDto))
export class WikiSectionsController {
  constructor(private readonly wikiSectionsService: WikiSectionsService) {}

  @Post()
  create(@Body() createWikiSectionDto: CreateWikiSectionDto) {
    return this.wikiSectionsService.create(createWikiSectionDto);
  }

  @Get()
  findAll() {
    return this.wikiSectionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wikiSectionsService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateWikiSectionDto: UpdateWikiSectionDto,
  ) {
    return this.wikiSectionsService.update(+id, updateWikiSectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wikiSectionsService.remove(+id);
  }
}
