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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should filter by single memberToken', async () => {
      const memberToken = 'mt-12345678';
      await service.findAll([], memberToken);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(schema.activityMembers);
      // Verify inArray is used with array containing single token
      // Note: We can't easily check the exact SQL object constructed by inArray, 
      // but we can verify the flow.
      expect(mockDb.query.activities.findMany).toHaveBeenCalled();
    });

    it('should filter by array of memberTokens', async () => {
      const memberTokens = ['mt-12345678', 'mt-87654321'];
      await service.findAll([], memberTokens);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(schema.activityMembers);
      expect(mockDb.query.activities.findMany).toHaveBeenCalled();
    });

    it('should not filter if no memberToken provided', async () => {
      await service.findAll([]);
      expect(mockDb.select).not.toHaveBeenCalled();
      expect(mockDb.query.activities.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined })
      );
    });
  });
});
