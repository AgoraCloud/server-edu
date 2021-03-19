import { Test, TestingModule } from '@nestjs/testing';
import { AuditingService } from './auditing.service';

describe('AuditingService', () => {
  let service: AuditingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditingService],
    }).compile();

    service = module.get<AuditingService>(AuditingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
