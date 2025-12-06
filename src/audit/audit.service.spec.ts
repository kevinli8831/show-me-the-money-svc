import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(), // Needed for some logic
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should log an event', async () => {
    await service.log({
      action: 'UPDATE_TRIP',
      entityType: 'ACTIVITIES',
      entityId: 1,
      performedByMemberToken: 'test-token',
    });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalled();
  });
});
