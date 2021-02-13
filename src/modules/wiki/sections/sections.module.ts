import { WorkspacesModule } from './../../workspaces/workspaces.module';
import { WikiSectionSchema } from './schemas/section.schema';
import { Module } from '@nestjs/common';
import { WikiSectionsService } from './sections.service';
import { WikiSectionsController } from './sections.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'WikiSection', schema: WikiSectionSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [WikiSectionsController],
  providers: [WikiSectionsService],
  exports: [WikiSectionsService],
})
export class WikiSectionsModule {}
