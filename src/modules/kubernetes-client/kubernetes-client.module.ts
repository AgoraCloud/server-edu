import { KubeConfig } from '@kubernetes/client-node';
import { DeploymentsModule } from './../deployments/deployments.module';
import { WorkspacesModule } from './../workspaces/workspaces.module';
import { Module } from '@nestjs/common';
import { KubernetesClientService } from './kubernetes-client.service';
import { KubernetesClientController } from './kubernetes-client.controller';

@Module({
  imports: [WorkspacesModule, DeploymentsModule],
  providers: [
    KubernetesClientService,
    { provide: KubeConfig, useValue: new KubeConfig() },
  ],
  controllers: [KubernetesClientController],
})
export class KubernetesClientModule {}
