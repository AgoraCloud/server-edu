import { Test, TestingModule } from '@nestjs/testing';
import { ProjectLanesService } from './lanes.service';

describe('LanesService', () => {
  let service: ProjectLanesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectLanesService],
    }).compile();

    service = module.get<ProjectLanesService>(ProjectLanesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
