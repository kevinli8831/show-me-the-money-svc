import { pgTable, bigserial, bigint, decimal, unique } from 'drizzle-orm/pg-core';
import { expenses } from './expenses';
import { users } from './users';

/**
 * Expense Payers Table Schema - 消費付款人資料表
 * 
 * 用途：
 * - 記錄邊個付咗錢
 * - 一個 expense 可以有多個 payers（例如兩個人一齊付）
 * - 記錄每個 payer 付咗幾多錢
 * 
 * 例子：
 * - Expense: "晚餐 $300"
 * - Payer 1: Kevin 付咗 $200
 * - Payer 2: Yanki 付咗 $100
 * - Total: $200 + $100 = $300
 */
export const expensePayers = pgTable('expense_payers', {
  /** Primary Key */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Expense ID（必填，Foreign Key）
   * 
   * onDelete: 'cascade' = 刪除 expense 會自動刪除所有 payers
   */
  expenseId: bigint('expense_id', { mode: 'number' }).notNull().references(() => expenses.id, { onDelete: 'cascade' }),

  /**
   * User ID（必填，Foreign Key）
   * 
   * 記錄邊個 user 付錢
   */
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id),

  /**
   * 付款金額（必填）
   * 
   * decimal(12, 2) = 最多 12 位數字，2 位小數
   * 記錄呢個 payer 付咗幾多錢
   */
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).notNull(),
}, (t) => ({
  /**
   * Unique Constraint
   * 
   * unique().on(t.expenseId, t.userId)
   * - 同一個 expense 入面，同一個 user 只可以出現一次
   * - 即係一個 user 唔可以係同一個 expense 入面付兩次錢
   * - 但同一個 user 可以係唔同嘅 expenses 付錢
   */
  unq: unique().on(t.expenseId, t.userId),
}));
