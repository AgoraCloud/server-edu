import { Test, TestingModule } from '@nestjs/testing';
import { KubernetesClientController } from './kubernetes-client.controller';

describe('KubernetesClientController', () => {
  let controller: KubernetesClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KubernetesClientController],
    }).compile();

    controller = module.get<KubernetesClientController>(
      KubernetesClientController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
