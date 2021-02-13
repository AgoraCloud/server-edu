import { Test, TestingModule } from '@nestjs/testing';
import { WikiSectionsService } from './sections.service';

describe('SectionsService', () => {
  let service: WikiSectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WikiSectionsService],
    }).compile();

    service = module.get<WikiSectionsService>(WikiSectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
