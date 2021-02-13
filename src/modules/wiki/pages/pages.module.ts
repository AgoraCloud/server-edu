import { WikiSectionsModule } from './../sections/sections.module';
import { WikiPageSchema } from './schemas/wiki-page.schema';
import { WorkspacesModule } from './../../workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { WikiPagesService } from './pages.service';
import { WikiPagesController } from './pages.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Page', schema: WikiPageSchema }]),
    WorkspacesModule,
    WikiSectionsModule,
  ],
  controllers: [WikiPagesController],
  providers: [WikiPagesService],
})
export class WikiPagesModule {}
