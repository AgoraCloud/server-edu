import { ProjectLane, ProjectLaneSchema } from './schemas/lane.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from './../projects.module';
import { WorkspacesModule } from './../../workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { ProjectLanesService } from './lanes.service';
import { ProjectLanesController } from './lanes.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectLane.name, schema: ProjectLaneSchema },
    ]),
    WorkspacesModule,
    ProjectsModule,
  ],
  controllers: [ProjectLanesController],
  providers: [ProjectLanesService],
  exports: [ProjectLanesService],
})
export class ProjectLanesModule {}
