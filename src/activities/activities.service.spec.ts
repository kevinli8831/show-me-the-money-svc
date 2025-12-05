import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { AuditService } from '../audit/audit.service';
import * as schema from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

// Mock dependencies
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  query: {
    activities: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
};

const mockAuditService = {
  log: jest.fn(),
};

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
    jest.clearAllMocks();
  });

  it('should include expenses without error', async () => {
    await service.findAll(['expenses']);
    expect(mockDb.query.activities.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        with: expect.objectContaining({
          expenses: expect.anything()
        })
      })
    );
  });
});
