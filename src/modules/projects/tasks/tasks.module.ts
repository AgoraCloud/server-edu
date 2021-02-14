import { ProjectTask, ProjectTaskSchema } from './schemas/task.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectLanesModule } from './../lanes/lanes.module';
import { ProjectsModule } from './../projects.module';
import { WorkspacesModule } from './../../workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { ProjectTasksService } from './tasks.service';
import { ProjectTasksController } from './tasks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectTask.name, schema: ProjectTaskSchema },
    ]),
    WorkspacesModule,
    ProjectsModule,
    ProjectLanesModule,
  ],
  controllers: [ProjectTasksController],
  providers: [ProjectTasksService],
})
export class ProjectTasksModule {}
