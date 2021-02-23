import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTasksController } from './tasks.controller';
import { ProjectTasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: ProjectTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectTasksController],
      providers: [ProjectTasksService],
    }).compile();

    controller = module.get<ProjectTasksController>(ProjectTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
