import { DeploymentsModule } from './../deployments/deployments.module';
import { WorkspacesModule } from './../workspaces/workspaces.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { WorkstationsService } from './workstations.service';
import { WorkstationsController } from './workstations.controller';
import { Workstation, WorkstationSchema } from './schema/workstation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workstation.name, schema: WorkstationSchema },
    ]),
    WorkspacesModule,
    DeploymentsModule,
  ],
  controllers: [WorkstationsController],
  providers: [WorkstationsService],
})
export class WorkstationsModule {}
