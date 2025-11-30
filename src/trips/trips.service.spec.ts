import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
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
    trips: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    users: {
      findFirst: jest.fn(),
    },
  },
};

import { AuditService } from '../audit/audit.service';

describe('TripsService', () => {
  let service: TripsService;
  let db: any;
  let auditService: any;

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
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

    service = module.get<TripsService>(TripsService);
    db = module.get(DrizzleAsyncProvider);
    auditService = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByShareCode', () => {
    it('should return a trip if found', async () => {
      const mockTrip = { id: 1, name: 'Test Trip', shareCode: 'ABCD1234' };
      mockDb.query.trips.findFirst.mockResolvedValue(mockTrip);

      const result = await service.findByShareCode('ABCD1234');
      expect(result).toEqual(mockTrip);
      expect(mockDb.query.trips.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(), // eq(schema.trips.shareCode, 'ABCD1234')
        }),
      );
    });

    it('should throw NotFoundException if trip not found', async () => {
      mockDb.query.trips.findFirst.mockResolvedValue(null);

      await expect(service.findByShareCode('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should include members if requested', async () => {
      const mockTrip = { id: 1, name: 'Test Trip', shareCode: 'ABCD1234', tripMembers: [] };
      mockDb.query.trips.findFirst.mockResolvedValue(mockTrip);

      await service.findByShareCode('ABCD1234', ['members']);
      expect(mockDb.query.trips.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            tripMembers: expect.anything(),
          }),
        }),
      );
    });

    it('should include expenses if requested', async () => {
      const mockTrip = { id: 1, name: 'Test Trip', shareCode: 'ABCD1234', expenses: [] };
      mockDb.query.trips.findFirst.mockResolvedValue(mockTrip);

      await service.findByShareCode('ABCD1234', ['expenses']);
      expect(mockDb.query.trips.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            expenses: expect.anything(),
          }),
        }),
      );
    });
  });
});
