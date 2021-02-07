import { KubeConfig } from '@kubernetes/client-node';
import { DeploymentsModule } from '../deployments/deployments.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { KubernetesService } from './kubernetes.service';
import { KubernetesController } from './kubernetes.controller';

@Module({
  imports: [WorkspacesModule, DeploymentsModule],
  providers: [
    KubernetesService,
    { provide: KubeConfig, useValue: new KubeConfig() },
  ],
  controllers: [KubernetesController],
})
export class KubernetesModule {}
