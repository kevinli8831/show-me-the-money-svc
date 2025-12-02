import { pgTable, bigserial, bigint, varchar, decimal, timestamp, text, numeric } from 'drizzle-orm/pg-core';
import { activities } from './activities';
import { relations } from 'drizzle-orm';

/**
 * Expenses Table Schema - 消費記錄資料表
 * 
 * Refactored to use Array-based storage for participants and amounts.
 * Replaces expense_payers and expense_splits tables.
 */
export const expenses = pgTable('expenses', {
  /** Primary Key */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Activity ID（必填，Foreign Key）
   * 
   * onDelete: 'cascade' = 刪除 activity 會自動刪除所有 expenses
   */
  activityId: bigint('activity_id', { mode: 'number' }).notNull().references(() => activities.id, { onDelete: 'cascade' }),

  /**
   * 消費描述
   */
  description: varchar('description', { length: 255 }).notNull(),

  /**
   * 總金額
   */
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

  /**
   * 貨幣
   */
  currency: varchar('currency', { length: 3 }).default('HKD'),

  /**
   * 參與者 Token 列表 (Member Tokens)
   * 
   * 對應 paidAmounts 和 shareAmounts 的順序
   */
  participantTokens: text('participant_tokens').array().notNull(),

  /**
   * 實際付款金額列表 (Paid Amounts)
   * 
   * 對應 participantTokens
   */
  paidAmounts: numeric('paid_amounts', { precision: 12, scale: 2 }).array().notNull(),

  /**
   * 應付金額列表 (Share Amounts)
   * 
   * 對應 participantTokens
   */
  shareAmounts: numeric('share_amounts', { precision: 12, scale: 2 }).array().notNull(),

  /**
   * 創建者 Token (Member Token)
   */
  createdByToken: varchar('created_by_token', { length: 255 }).notNull(),

  /** 創建時間 */
  createdAt: timestamp('created_at').defaultNow(),
});


export const expensesRelations = relations(expenses, ({ one }) => ({
  activity: one(activities, {
    fields: [expenses.activityId],
    references: [activities.id],
  }),
}));