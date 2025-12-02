import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuditService } from '../audit/audit.service';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * ExpensesService - 處理所有 Expense 相關嘅業務邏輯
 * 
 * 主要功能：
 * - CRUD operations for expenses
 * - 管理 activity 入面嘅消費記錄
 * 
 * 注意：
 * - 每個 expense 必須屬於一個 activity
 * - 刪除 activity 會自動刪除所有相關嘅 expenses (cascade delete)
 */
@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
    private readonly auditService: AuditService,
  ) { }

  /**
   * 創建新 Expense（連同 payers 同 splits）
   * 
   * 流程：
   * 1. Validate payers 同 splits 總和
   * 2. Insert expense
   * 3. Insert expense payers（如果有提供）
   * 4. Insert expense splits（如果有提供）
   * 
   * 例子：
   * createExpenseDto = {
   *   activityId: 1,
   *   title: "晚餐",
   *   amount: "300.00",
   *   currency: "HKD",
   *   category: "食飯",
   *   createdBy: 1,
   *   payers: [
   *     { userId: 1, amountPaid: "200.00" },
   *     { userId: 2, amountPaid: "100.00" }
   *   ],
   *   splits: [
   *     { userId: 1, shareAmount: "150.00", splitMethod: "custom" },
   *     { userId: 2, shareAmount: "150.00", splitMethod: "custom" }
   *   ]
   * }
   */
  async create(createExpenseDto: CreateExpenseDto) {
    // === Validation ===
    // 1. Validate array lengths match
    if (
      createExpenseDto.participantTokens.length !== createExpenseDto.paidAmounts.length ||
      createExpenseDto.participantTokens.length !== createExpenseDto.shareAmounts.length
    ) {
      throw new Error('Participant tokens, paid amounts, and share amounts must have the same length');
    }

    // 2. Validate paid amounts total = expense amount
    const paidTotal = createExpenseDto.paidAmounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
    const expenseAmount = parseFloat(createExpenseDto.amount);

    if (Math.abs(paidTotal - expenseAmount) > 0.01) {
      throw new Error(`Paid amounts total (${paidTotal}) does not match expense amount (${expenseAmount})`);
    }

    // 3. Validate share amounts total = expense amount
    const shareTotal = createExpenseDto.shareAmounts.reduce((sum, amount) => sum + parseFloat(amount), 0);

    if (Math.abs(shareTotal - expenseAmount) > 0.01) {
      throw new Error(`Share amounts total (${shareTotal}) does not match expense amount (${expenseAmount})`);
    }

    // === Insert Data ===
    const [expense] = await this.db
      .insert(schema.expenses)
      .values({
        activityId: createExpenseDto.activityId,
        description: createExpenseDto.description,
        amount: createExpenseDto.amount,
        currency: createExpenseDto.currency,
        participantTokens: createExpenseDto.participantTokens,
        paidAmounts: createExpenseDto.paidAmounts,
        shareAmounts: createExpenseDto.shareAmounts,
        createdByToken: createExpenseDto.createdByToken,
      })
      .returning();

    return expense;
  }

  /**
   * 獲取所有 Expenses
   */
  async findAll() {
    return this.db.query.expenses.findMany();
  }

  /**
   * 根據 ID 獲取單個 Expense
   */
  async findOne(id: number) {
    const expense = await this.db.query.expenses.findFirst({
      where: eq(schema.expenses.id, id),
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  /**
   * 更新 Expense
   */
  async update(id: number, memberToken: string, updateExpenseDto: UpdateExpenseDto, userId?: number) {
    const updateData = updateExpenseDto;
    const [expense] = await this.db
      .update(schema.expenses)
      .set(updateData)
      .where(eq(schema.expenses.id, id))
      .returning();

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    // Log audit
    await this.auditService.log({
      action: 'UPDATE_EXPENSE',
      entityType: 'EXPENSE',
      entityId: expense.id,
      activityId: expense.activityId,
      performedByMemberToken: memberToken,
      performedByUserId: userId,
      details: updateData,
    });

    return expense;
  }

  /**
   * 刪除 Expense
   * 
   * 注意：會同時刪除所有相關嘅 expense_payers 同 expense_splits (cascade delete)
   */
  async remove(id: number, memberToken: string, userId?: number) {
    const [expense] = await this.db
      .delete(schema.expenses)
      .where(eq(schema.expenses.id, id))
      .returning();

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    // Log audit
    await this.auditService.log({
      action: 'DELETE_EXPENSE',
      entityType: 'EXPENSE',
      entityId: expense.id,
      performedByMemberToken: memberToken,
      performedByUserId: userId,
      activityId: expense.activityId,
    });

    return expense;
  }
}
