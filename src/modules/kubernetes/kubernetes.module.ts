import { Config, KubernetesConfig } from '../../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
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
import { KubernetesNamespacesService } from './kubernetes-namespaces.service';
import { KubernetesNetworkPoliciesService } from './kubernetes-network-policies.service';
import { KubernetesRolesService } from './kubernetes-roles.service';
import { KubernetesResourceQuotasService } from './kubernetes-resource-quotas.service';
import { KubernetesSecretsService } from './kubernetes-secrets.service';
import { KubernetesPersistentVolumeClaimsService } from './kubernetes-persistent-volume-claims.service';
import { KubernetesServicesService } from './kubernetes-services.service';
import { KubernetesDeploymentsService } from './kubernetes-deployments.service';
import { KubernetesPodsService } from './kubernetes-pods.service';

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
    {
      provide: 'KubernetesConfig',
      useFactory: (configService: ConfigService<Config>) => {
        return configService.get<KubernetesConfig>('kubernetes');
      },
      inject: [ConfigService],
    },
  ];
};

@Module({
  imports: [WorkspacesModule, DeploymentsModule],
  providers: [
    ...makeKubernetes(),
    KubernetesService,
    KubernetesNamespacesService,
    KubernetesNetworkPoliciesService,
    KubernetesRolesService,
    KubernetesResourceQuotasService,
    KubernetesSecretsService,
    KubernetesPersistentVolumeClaimsService,
    KubernetesServicesService,
    KubernetesDeploymentsService,
    KubernetesPodsService,
  ],
  controllers: [KubernetesController],
})
export class KubernetesModule {}
