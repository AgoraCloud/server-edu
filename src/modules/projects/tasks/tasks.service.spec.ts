import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTasksService } from './tasks.service';

describe('TasksService', () => {
  let service: ProjectTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectTasksService],
    }).compile();

    service = module.get<ProjectTasksService>(ProjectTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
