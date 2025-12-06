import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesService } from './activities.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock dependencies
const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  query: {
    activities: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    users: {
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

  describe('create', () => {
    it('should create an activity and add creator as member', async () => {
      const createDto = { name: 'Test Trip', creatorUserId: 1 };
      const mockActivity = { id: 1, ...createDto };
      const mockMember = { memberToken: 'mt-tok', isGuest: false };

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      // First call (Activity) returns [activity], Second call (Member) returns [member]
      mockDb.returning.mockReturnValueOnce([mockActivity]).mockReturnValueOnce([mockMember]);

      const result = await service.create(createDto);

      expect(mockDb.insert).toHaveBeenCalledTimes(2); // One for activity, one for member
      expect(result.activity).toEqual(mockActivity);
      expect(result.member.memberToken).toMatch(/^mt-/);
    });
  });

  describe('findAll', () => {
    it('should return array of activities', async () => {
      const mockActivities = [{ id: 1, name: 'Trip A' }];
      mockDb.query.activities.findMany.mockResolvedValue(mockActivities);

      const result = await service.findAll();
      expect(result).toEqual(mockActivities);
      expect(mockDb.query.activities.findMany).toHaveBeenCalled();
    });

    it('should handle undefined memberTokens correctly', async () => {
      await service.findAll();
      // Should not call where with inArray for tokens if undefined
    });
  });

  describe('findOne', () => {
    it('should return a single activity', async () => {
      const mockActivity = { id: 1, name: 'Trip A' };
      mockDb.query.activities.findFirst.mockResolvedValue(mockActivity);

      const result = await service.findOne(1);
      expect(result).toEqual(mockActivity);
    });

    it('should throw NotFoundException if not found', async () => {
      mockDb.query.activities.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return activity', async () => {
      const updateDto = { name: 'Updated Trip' };
      const mockActivity = { id: 1, name: 'Updated Trip' };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([mockActivity]);

      const result = await service.update(1, 'token', updateDto, 123);
      expect(result).toEqual(mockActivity);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if update fails (no record)', async () => {
      mockDb.returning.mockReturnValue([]); // No record returned
      await expect(service.update(999, 'token', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete and log audit', async () => {
      const mockActivity = { id: 1 };
      mockDb.delete.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([mockActivity]);

      await service.remove(1, 'token', 123);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('should add member successfully', async () => {
      mockDb.query.users.findFirst.mockResolvedValue({ name: 'User A' });
      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);

      await service.addMember(1, { userId: 2 });
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('join', () => {
    it('should create guest user and member', async () => {
      // Mock findOne for activity check
      mockDb.query.activities.findFirst.mockResolvedValue({ id: 1 });

      // Mock User insert
      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.returning
        .mockReturnValueOnce([{ id: 99, name: 'Guest' }]) // User
        .mockReturnValueOnce([{ memberToken: 'mt-guest' }]); // Member

      const result = await service.join(1, 'Guest');
      expect(result.memberToken).toBe('mt-guest');
    });
  });
});
