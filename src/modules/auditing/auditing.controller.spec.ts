import { Test, TestingModule } from '@nestjs/testing';
import { AuditingController } from './auditing.controller';
import { AuditingService } from './auditing.service';

describe('AuditingController', () => {
  let controller: AuditingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditingController],
      providers: [AuditingService],
    }).compile();

    controller = module.get<AuditingController>(AuditingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
