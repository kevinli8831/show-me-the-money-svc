import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

// Mock dependencies
const mockDb = {
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  query: {
    expenses: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
};

const mockAuditService = {
  log: jest.fn(),
};

describe('ExpensesService', () => {
  let service: ExpensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
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

    service = module.get<ExpensesService>(ExpensesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create expense successfully when amounts match', async () => {
      const dto: any = {
        activityId: 1,
        totalAmount: '100.00',
        participants: [
          { paidAmount: '100.00', owedAmount: '50.00', memberToken: 'mt-1' },
          { paidAmount: '0.00', owedAmount: '50.00', memberToken: 'mt-2' }
        ]
      };

      const mockExpense = { id: 1, totalAmount: '100.00' };
      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([mockExpense]);

      const result = await service.create(dto);
      expect(result).toEqual(mockExpense);
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // 1 Expense, 1 Participants Bulk
    });

    it('should throw error if paid amounts do not match total', async () => {
      const dto: any = {
        totalAmount: '100.00',
        participants: [{ paidAmount: '50.00', owedAmount: '50.00' }]
      };
      await expect(service.create(dto)).rejects.toThrow(/Paid amounts total/);
    });

    it('should throw error if owed amounts do not match total', async () => {
      const dto: any = {
        totalAmount: '100.00',
        participants: [{ paidAmount: '100.00', owedAmount: '90.00' }]
      };
      await expect(service.create(dto)).rejects.toThrow(/Owed amounts total/);
    });
  });

  describe('findOne', () => {
    it('should return expense if found', async () => {
      mockDb.query.expenses.findFirst.mockResolvedValue({ id: 1 });
      const res = await service.findOne(1);
      expect(res.id).toBe(1);
    });

    it('should throw NotFound if not found', async () => {
      mockDb.query.expenses.findFirst.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update expense and return it', async () => {
      const mockExpense = { id: 1, activityId: 1 };
      // Update Logic: Update Header -> Return New -> Delete Parts -> Insert Parts
      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([mockExpense]);

      mockDb.delete.mockReturnValue(mockDb); // Delete participants logic

      const dto = { description: 'New', participants: [] };
      await service.update(1, 'token', dto);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete expense', async () => {
      mockDb.delete.mockReturnValue(mockDb);
      mockDb.returning.mockReturnValue([{ id: 1 }]);

      await service.remove(1, 'token');
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });
});
