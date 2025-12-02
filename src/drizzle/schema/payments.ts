import { pgTable, bigserial, bigint, decimal, char, timestamp, text } from 'drizzle-orm/pg-core';
import { activities } from './activities';
import { users } from './users';

/**
 * Payments Table Schema - 還款記錄資料表
 * 
 * 用途：
 * - 記錄 activity 入面嘅還款記錄
 * - 記錄邊個還錢俾邊個
 * - 用於結算 activity 嘅欠款
 * 
 * 流程：
 * 1. Activity 完結後，計算每個人應該俾幾多錢（根據 expense_splits）
 * 2. 計算每個人實際俾咗幾多錢（根據 expense_payers）
 * 3. 計算每個人欠幾多錢或者多俾咗幾多錢
 * 4. 用 payments 記錄還款
 * 
 * 例子：
 * - Kevin 多俾咗 $100
 * - Yanki 欠咗 $50
 * - John 欠咗 $50
 * - Payment 1: Yanki 還 $50 俾 Kevin
 * - Payment 2: John 還 $50 俾 Kevin
 */
export const payments = pgTable('payments', {
  /** Primary Key */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Activity ID（必填，Foreign Key）
   * 
   * onDelete: 'cascade' = 刪除 activity 會自動刪除所有 payments
   */
  activityId: bigint('activity_id', { mode: 'number' }).notNull().references(() => activities.id, { onDelete: 'cascade' }),

  /**
   * 付款人 User ID（必填，Foreign Key）
   * 
   * 記錄邊個 user 還錢（欠錢嘅人）
   */
  fromUserId: bigint('from_user_id', { mode: 'number' }).notNull().references(() => users.id),

  /**
   * 收款人 User ID（必填，Foreign Key）
   * 
   * 記錄邊個 user 收錢（多俾咗錢嘅人）
   */
  toUserId: bigint('to_user_id', { mode: 'number' }).notNull().references(() => users.id),

  /**
   * 還款金額（必填）
   * 
   * decimal(12, 2) = 最多 12 位數字，2 位小數
   * 記錄還咗幾多錢
   */
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

  /**
   * 貨幣代碼（預設 'HKD'）
   * 
   * char(3) = 固定 3 個字符
   * 例如: "HKD", "USD", "CNY"
   */
  currency: char('currency', { length: 3 }).default('HKD'),

  /**
   * 還款時間（自動設定）
   * 
   * 記錄幾時還錢
   */
  paidAt: timestamp('paid_at').defaultNow(),

  /**
   * 備註（可選）
   * 
   * 用於記錄額外資訊（例如還款方式：現金、轉帳等）
   */
  note: text('note'),
});
