import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NotFoundException } from '@nestjs/common';

// Mock database
const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  query: {
    activities: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    users: {
      findFirst: jest.fn(),
    },
  },
};

import { AuditService } from '../audit/audit.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let db: any;
  let auditService: any;

  const mockAuditService = {
    log: jest.fn(),
  };

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
    db = module.get(DrizzleAsyncProvider);
    auditService = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByShareCode', () => {
    it('should return a activity if found', async () => {
      const mockActivity = { id: 1, name: 'Test Activity', shareCode: 'ABCD1234' };
      mockDb.query.activities.findFirst.mockResolvedValue(mockActivity);

      const result = await service.findByShareCode('ABCD1234');
      expect(result).toEqual(mockActivity);
      expect(mockDb.query.activities.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(), // eq(schema.activities.shareCode, 'ABCD1234')
        }),
      );
    });

    it('should throw NotFoundException if activity not found', async () => {
      mockDb.query.activities.findFirst.mockResolvedValue(null);

      await expect(service.findByShareCode('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should include members if requested', async () => {
      const mockActivity = { id: 1, name: 'Test Activity', shareCode: 'ABCD1234', activityMembers: [] };
      mockDb.query.activities.findFirst.mockResolvedValue(mockActivity);

      await service.findByShareCode('ABCD1234', ['members']);
      expect(mockDb.query.activities.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            activityMembers: expect.anything(),
          }),
        }),
      );
    });

    it('should include expenses if requested', async () => {
      const mockActivity = { id: 1, name: 'Test Activity', shareCode: 'ABCD1234', expenses: [] };
      mockDb.query.activities.findFirst.mockResolvedValue(mockActivity);

      await service.findByShareCode('ABCD1234', ['expenses']);
      expect(mockDb.query.activities.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            expenses: expect.anything(),
          }),
        }),
      );
    });
  });
});
