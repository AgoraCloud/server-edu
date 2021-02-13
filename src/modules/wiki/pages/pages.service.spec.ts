import { Test, TestingModule } from '@nestjs/testing';
import { WikiPagesService } from './pages.service';

describe('WikiPagesService', () => {
  let service: WikiPagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WikiPagesService],
    }).compile();

    service = module.get<WikiPagesService>(WikiPagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
