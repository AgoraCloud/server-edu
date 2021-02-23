import { Test, TestingModule } from '@nestjs/testing';
import { WikiSectionsController } from './sections.controller';
import { WikiSectionsService } from './sections.service';

describe('SectionsController', () => {
  let controller: WikiSectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WikiSectionsController],
      providers: [WikiSectionsService],
    }).compile();

    controller = module.get<WikiSectionsController>(WikiSectionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
