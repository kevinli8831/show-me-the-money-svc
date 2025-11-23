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
   *   tripId: 1,
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
    const { payers, splits, amount, ...expenseData } = createExpenseDto;
    
    // === Validation ===
    
    // 1. Validate payers 總和 = amount
    if (payers && payers.length > 0) {
      const payersTotal = payers.reduce((sum, payer) => {
        return sum + parseFloat(payer.amountPaid);
      }, 0);
      
      const expenseAmount = parseFloat(amount);
      
      // 用 toFixed(2) 避免 floating point precision 問題
      if (payersTotal.toFixed(2) !== expenseAmount.toFixed(2)) {
        throw new Error(
          `Payers 總和 ($${payersTotal.toFixed(2)}) 唔等於 expense amount ($${expenseAmount.toFixed(2)})`
        );
      }
    }
    
    // 2. Validate splits 總和 = amount 或 percentage = 1.0
    if (splits && splits.length > 0) {
      const expenseAmount = parseFloat(amount);
      
      // 檢查係用 shareAmount 定 percentage
      const hasShareAmount = splits.some(s => s.shareAmount !== undefined);
      const hasPercentage = splits.some(s => s.percentage !== undefined);
      
      if (hasShareAmount) {
        // 用 shareAmount：總和應該 = amount
        const splitsTotal = splits.reduce((sum, split) => {
          return sum + (split.shareAmount ? parseFloat(split.shareAmount) : 0);
        }, 0);
        
        if (splitsTotal.toFixed(2) !== expenseAmount.toFixed(2)) {
          throw new Error(
            `Splits 總和 ($${splitsTotal.toFixed(2)}) 唔等於 expense amount ($${expenseAmount.toFixed(2)})`
          );
        }
      } else if (hasPercentage) {
        // 用 percentage：總和應該 = 1.0
        const percentageTotal = splits.reduce((sum, split) => {
          return sum + (split.percentage ? parseFloat(split.percentage) : 0);
        }, 0);
        
        if (percentageTotal.toFixed(4) !== '1.0000') {
          throw new Error(
            `Splits percentage 總和 (${percentageTotal.toFixed(4)}) 唔等於 1.0000`
          );
        }
      }
    }
    
    // === Insert Data ===
    
    // 1. Insert expense
    const [expense] = await this.db
      .insert(schema.expenses)
      .values({ ...expenseData, amount })
      .returning();

    // 2. Insert expense payers（如果有提供）
    if (payers && payers.length > 0) {
      await this.db.insert(schema.expensePayers).values(
        payers.map(payer => ({
          expenseId: expense.id,
          userId: payer.userId,
          amountPaid: payer.amountPaid,
        }))
      );
    }

    // 3. Insert expense splits（如果有提供）
    if (splits && splits.length > 0) {
      await this.db.insert(schema.expenseSplits).values(
        splits.map(split => ({
          expenseId: expense.id,
          userId: split.userId,
          shareAmount: split.shareAmount,
          percentage: split.percentage,
          splitMethod: split.splitMethod || 'equal',
          note: split.note,
        }))
      );
    }

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
