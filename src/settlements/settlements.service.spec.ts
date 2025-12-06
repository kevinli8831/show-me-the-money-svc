import { Test, TestingModule } from '@nestjs/testing';
import { SettlementsService } from './settlements.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

// Mock dependencies
const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  query: {
    settlements: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    activityMembers: {
      findFirst: jest.fn(),
    },
  },
};

describe('SettlementsService', () => {
  let service: SettlementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettlementsService,
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<SettlementsService>(SettlementsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create settlement successfully', async () => {
      // Mock user fetching
      mockDb.query.activityMembers.findFirst
        .mockResolvedValueOnce({ memberToken: 'payer-tok' }) // Payer
        .mockResolvedValueOnce({ memberToken: 'receiver-tok' }); // Receiver

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([{ id: 1 }]);

      const dto = { activityId: 1, payerId: 10, receiverId: 20, amount: '50.00' };
      // Note: create modifies the DTO to add tokens, but the service argument expected by TS is CreateSettlementDto
      // In the actual service, it takes any payload? No, it takes CreateSettlementDto
      // Wait, the CreateSettlementDto definition requires payerToken/receiverToken.
      // But in the service implementation (lines 35-37), it inserts activityId, payerToken, receiverToken, amount.
      // The Service logic finds tokens based on IDs passed?
      // Let's re-read SettlementsService.create (Step 529):
      /*
      async create(createSettlementDto: CreateSettlementDto) {
          const [settlement] = await this.db
            .insert(schema.settlements)
            .values(createSettlementDto)
            .returning();
          return settlement;
      }
      */
      // It just inserts the DTO directly! 
      // The DTO requires payerToken and receiverToken.
      // The frontend/controller is responsible for calculating or providing them?
      // My test was passing IDs (payerId, receiverId) which are NOT in the schema/DTO.

      const realDto = { activityId: 1, payerToken: 'ptok', receiverToken: 'rtok', amount: '50.00' };
      const result = await service.create(realDto);
      expect(result.id).toBe(1);
    });

    // There is no logic in Create to check for payer! It just inserts!
    // So the previous test 'should throw BadRequest if payer not found' is invalid for the CURRENT implementation.
    // I will remove that test case as it tests non-existent logic.
  });

  describe('update', () => {
    it('should update settlement', async () => {
      mockDb.update.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([{ id: 1, status: 'paid' }]);

      const result = await service.update(1, { status: 'paid' });
      expect(result.status).toBe('paid');
    });

    it('should throw NotFound if update fails', async () => {
      mockDb.returning.mockReturnValue([]);
      await expect(service.update(999, { status: 'paid' })).rejects.toThrow(NotFoundException);
    });
  });
});
