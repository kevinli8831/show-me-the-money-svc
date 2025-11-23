import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * ExpensesService - 處理所有 Expense 相關嘅業務邏輯
 * 
 * 主要功能：
 * - CRUD operations for expenses
 * - 管理 trip 入面嘅消費記錄
 * 
 * 注意：
 * - 每個 expense 必須屬於一個 trip
 * - 刪除 trip 會自動刪除所有相關嘅 expenses (cascade delete)
 */
@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  /**
   * 創建新 Expense
   * 
   * 例子：
   * createExpenseDto = {
   *   tripId: 1,
   *   title: "晚餐",
   *   amount: "300.50",
   *   currency: "HKD",
   *   category: "食飯",
   *   createdBy: 1
   * }
   */
  async create(createExpenseDto: CreateExpenseDto) {
    const [expense] = await this.db
      .insert(schema.expenses)
      .values(createExpenseDto)
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
  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    const [expense] = await this.db
      .update(schema.expenses)
      .set(updateExpenseDto)
      .where(eq(schema.expenses.id, id))
      .returning();

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  /**
   * 刪除 Expense
   * 
   * 注意：會同時刪除所有相關嘅 expense_payers 同 expense_splits (cascade delete)
   */
  async remove(id: number) {
    const [expense] = await this.db
      .delete(schema.expenses)
      .where(eq(schema.expenses.id, id))
      .returning();

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }
}
