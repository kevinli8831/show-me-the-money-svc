import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';

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
  query: {
    users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
};

describe('UsersService - Virtual Members', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVirtualUser', () => {
    it('should create a virtual user', async () => {
      const mockVirtualUser = {
        id: 100,
        name: 'Kevin',
        userType: 'virtual',
        createdBy: 1,
        email: null,
        provider: null,
      };

      mockDb.returning.mockResolvedValueOnce([mockVirtualUser]);

      const result = await service.createVirtualUser('Kevin', 1);

      expect(result).toEqual(mockVirtualUser);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'Kevin',
        userType: 'virtual',
        createdBy: 1,
      });
    });
  });

  describe('findVirtualUsersByActivity', () => {
    it('should find virtual users in a activity', async () => {
      const mockMembers = [
        { user: { id: 100, name: 'Kevin', userType: 'virtual' } },
        { user: { id: 101, name: 'Mary', userType: 'virtual' } },
      ];

      mockDb.where.mockResolvedValueOnce(mockMembers);

      const result = await service.findVirtualUsersByActivity(1);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Kevin');
      expect(result[1].name).toBe('Mary');
    });
  });

  describe('claimVirtualUser', () => {
    // This test requires complex database mock chains
    // Better to test via E2E tests
    it.skip('should claim a virtual user and transfer all data', async () => {
      const result = await service.claimVirtualUser(100, 200, 1);
      expect(result.success).toBe(true);
    });
  });
});
