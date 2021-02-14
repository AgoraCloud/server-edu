import { Test, TestingModule } from '@nestjs/testing';
import { LanesController } from './lanes.controller';
import { LanesService } from './lanes.service';

describe('LanesController', () => {
  let controller: LanesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LanesController],
      providers: [LanesService],
    }).compile();

    controller = module.get<LanesController>(LanesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
