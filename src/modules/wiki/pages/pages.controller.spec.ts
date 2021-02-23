import { Test, TestingModule } from '@nestjs/testing';
import { WikiPagesController } from './pages.controller';
import { WikiPagesService } from './pages.service';

describe('WikiPagesController', () => {
  let controller: WikiPagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WikiPagesController],
      providers: [WikiPagesService],
    }).compile();

    controller = module.get<WikiPagesController>(WikiPagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
