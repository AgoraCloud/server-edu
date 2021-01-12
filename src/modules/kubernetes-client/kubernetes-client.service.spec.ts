import { Test, TestingModule } from '@nestjs/testing';
import { KubernetesClientService } from './kubernetes-client.service';

describe('KubernetesClientService', () => {
  let service: KubernetesClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KubernetesClientService],
    }).compile();

    service = module.get<KubernetesClientService>(KubernetesClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
