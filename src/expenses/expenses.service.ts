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
   * 創建新 Expense（連同 expense_participants）
   * 
   * 流程：
   * 1. Validate participants 總和
   * 2. Insert expense
   * 3. Insert expense_participants
   * 
   * 例子：
   * createExpenseDto = {
   *   activityId: 1,
   *   description: "晚餐",
   *   totalAmount: "300.00",
   *   currency: "HKD",
   *   createdByToken: "mt-12345678",
   *   participants: [
   *     { memberToken: "mt-12345678", paidAmount: "200.00", owedAmount: "150.00" },
   *     { memberToken: "mt-87654321", paidAmount: "100.00", owedAmount: "150.00" }
   *   ]
   * }
   */
  async create(createExpenseDto: CreateExpenseDto) {
    // === Validation ===
    // 1. Validate paid amounts total = totalAmount
    const paidTotal = createExpenseDto.participants.reduce((sum, p) => sum + parseFloat(p.paidAmount), 0);
    const expenseAmount = parseFloat(createExpenseDto.totalAmount);

    if (Math.abs(paidTotal - expenseAmount) > 0.01) {
      throw new Error(`Paid amounts total (${paidTotal}) does not match expense total amount (${expenseAmount})`);
    }

    // 2. Validate owed amounts total = totalAmount
    const owedTotal = createExpenseDto.participants.reduce((sum, p) => sum + parseFloat(p.owedAmount), 0);

    if (Math.abs(owedTotal - expenseAmount) > 0.01) {
      throw new Error(`Owed amounts total (${owedTotal}) does not match expense total amount (${expenseAmount})`);
    }

    // === Insert Data ===
    // 1. Insert Expense Header
    const [expense] = await this.db
      .insert(schema.expenses)
      .values({
        activityId: createExpenseDto.activityId,
        description: createExpenseDto.description,
        totalAmount: createExpenseDto.totalAmount,
        currency: createExpenseDto.currency,
        createdByToken: createExpenseDto.createdByToken,
      })
      .returning();

    // 2. Insert Participants
    if (createExpenseDto.participants.length > 0) {
      await this.db.insert(schema.expenseParticipants).values(
        createExpenseDto.participants.map((p) => ({
          expenseId: expense.id,
          memberToken: p.memberToken,
          paidAmount: p.paidAmount,
          owedAmount: p.owedAmount,
        }))
      );
    }

    return expense;
  }

  /**
   * 獲取所有 Expenses (Include Participants)
   */
  async findAll() {
    return this.db.query.expenses.findMany({
      with: {
        participants: true,
      },
    });
  }

  /**
   * 根據 ID 獲取單個 Expense
   */
  async findOne(id: number) {
    const expense = await this.db.query.expenses.findFirst({
      where: eq(schema.expenses.id, id),
      with: {
        participants: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  /**
   * 更新 Expense
   * 
   * Check logic: if participants provided, replace all.
   */
  async update(id: number, memberToken: string, updateExpenseDto: UpdateExpenseDto, userId?: number) {
    // Basic update on expense table
    const updateData: any = { ...updateExpenseDto };
    delete updateData.participants; // Handle participants separately

    // Calculate totalAmount if provided (for validation only, assumes update logic is solid or simple replace)
    // Actually, handling partial update for normalized tables is complex.
    // For now, let's assume if participants are provided, we replace them all.

    let expense;

    // Update header if there are fields to update
    if (Object.keys(updateData).length > 0) {
      // Map totalAmount if it's there (it might be passed as amount in some legacy thought, but DTO should enforce totalAmount)
      // DTO has totalAmount.

      [expense] = await this.db
        .update(schema.expenses)
        .set(updateData)
        .where(eq(schema.expenses.id, id))
        .returning();
    } else {
      // Fetch if not updated
      expense = await this.db.query.expenses.findFirst({
        where: eq(schema.expenses.id, id),
      });
    }

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    // Update participants if provided
    if (updateExpenseDto.participants) {
      // Delete old
      await this.db.delete(schema.expenseParticipants).where(eq(schema.expenseParticipants.expenseId, id));

      // Insert new
      if (updateExpenseDto.participants.length > 0) {
        await this.db.insert(schema.expenseParticipants).values(
          updateExpenseDto.participants.map((p) => ({
            expenseId: id,
            memberToken: p.memberToken,
            paidAmount: p.paidAmount,
            owedAmount: p.owedAmount,
          }))
        );
      }
    }

    // Log audit
    await this.auditService.log({
      action: 'UPDATE_EXPENSE',
      entityType: 'EXPENSE',
      entityId: expense.id,
      activityId: expense.activityId,
      performedByMemberToken: memberToken,
      performedByUserId: userId,
      details: updateExpenseDto,
    });

    return expense;
  }

  /**
   * 刪除 Expense
   * 
   * 注意：會同時刪除所有相關嘅 expense_participants (cascade delete)
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
