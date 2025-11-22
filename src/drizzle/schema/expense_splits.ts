import { pgTable, bigserial, bigint, decimal, varchar, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { expenses } from './expenses';
import { users } from './users';

/**
 * Expense Splits Table Schema - 消費分帳資料表
 * 
 * 用途：
 * - 記錄點樣分帳
 * - 一個 expense 可以有多個 splits（例如 3 個人平分）
 * - 記錄每個人應該俾幾多錢
 * 
 * 分帳方式：
 * 1. Equal split（平分）: 每個人俾一樣嘅錢
 * 2. Percentage split（百分比）: 根據百分比分
 * 3. Custom split（自訂）: 每個人俾唔同嘅錢
 * 
 * 例子：
 * - Expense: "晚餐 $300"
 * - Split 1: Kevin 應該俾 $150 (50%)
 * - Split 2: Yanki 應該俾 $100 (33.33%)
 * - Split 3: John 應該俾 $50 (16.67%)
 */
export const expenseSplits = pgTable('expense_splits', {
  /** Primary Key */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Expense ID（必填，Foreign Key）
   * 
   * onDelete: 'cascade' = 刪除 expense 會自動刪除所有 splits
   */
  expenseId: bigint('expense_id', { mode: 'number' }).notNull().references(() => expenses.id, { onDelete: 'cascade' }),

  /**
   * User ID（必填，Foreign Key）
   * 
   * 記錄邊個 user 應該俾錢
   */
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id),

  /**
   * 分帳金額（可選）
   * 
   * decimal(12, 2) = 最多 12 位數字，2 位小數
   * 記錄呢個 user 應該俾幾多錢
   * 
   * 如果用 percentage split，呢個 field 可以係 NULL（會根據 percentage 計算）
   */
  shareAmount: decimal('share_amount', { precision: 12, scale: 2 }),

  /**
   * 百分比（可選）
   * 
   * decimal(5, 4) = 最多 5 位數字，4 位小數
   * 例如: 0.3333 = 33.33%
   * 
   * 如果用 custom split，呢個 field 可以係 NULL
   */
  percentage: decimal('percentage', { precision: 5, scale: 4 }),

  /**
   * 分帳方式（預設 'equal'）
   * 
   * 可能嘅值：
   * - 'equal': 平分
   * - 'percentage': 百分比
   * - 'custom': 自訂金額
   */
  splitMethod: varchar('split_method', { length: 20 }).default('equal'),

  /**
   * 備註（可選）
   * 
   * 用於記錄點解呢個 user 要俾咁多/咁少錢
   */
  note: text('note'),

  /** 創建時間（自動設定） */
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  /**
   * Unique Constraint
   * 
   * unique().on(t.expenseId, t.userId)
   * - 同一個 expense 入面，同一個 user 只可以出現一次
   * - 即係一個 user 唔可以係同一個 expense 入面有兩個 split records
   */
  unq: unique().on(t.expenseId, t.userId),
}));
