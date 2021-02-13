import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  NetworkingV1Api,
  RbacAuthorizationV1Api,
} from '@kubernetes/client-node';
import { DeploymentsModule } from '../deployments/deployments.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Module, Provider } from '@nestjs/common';
import { KubernetesService } from './kubernetes.service';
import { KubernetesController } from './kubernetes.controller';

const makeKubernetes = (): Provider[] => {
  const kc: KubeConfig = new KubeConfig();
  kc.loadFromDefault();
  return [
    {
      provide: KubeConfig,
      useValue: kc,
    },
    {
      provide: CoreV1Api,
      useValue: kc.makeApiClient(CoreV1Api),
    },
    {
      provide: AppsV1Api,
      useValue: kc.makeApiClient(AppsV1Api),
    },
    {
      provide: NetworkingV1Api,
      useValue: kc.makeApiClient(NetworkingV1Api),
    },
    {
      provide: RbacAuthorizationV1Api,
      useValue: kc.makeApiClient(RbacAuthorizationV1Api),
    },
  ];
};

@Module({
  imports: [WorkspacesModule, DeploymentsModule],
  providers: [KubernetesService, ...makeKubernetes()],
  controllers: [KubernetesController],
})
export class KubernetesModule {}
