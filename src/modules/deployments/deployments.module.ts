import { DeploymentSchema } from './schemas/deployment.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from './../workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { DeploymentsService } from './deployments.service';
import { DeploymentsController } from './deployments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Deployment', schema: DeploymentSchema },
    ]),
    WorkspacesModule,
  ],
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
