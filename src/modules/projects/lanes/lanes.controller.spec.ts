import { Test, TestingModule } from '@nestjs/testing';
import { ProjectLanesController } from './lanes.controller';
import { ProjectLanesService } from './lanes.service';

describe('LanesController', () => {
  let controller: ProjectLanesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectLanesController],
      providers: [ProjectLanesService],
    }).compile();

    controller = module.get<ProjectLanesController>(ProjectLanesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
