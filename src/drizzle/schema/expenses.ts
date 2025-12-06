import { pgTable, bigserial, bigint, varchar, decimal, timestamp, text, numeric } from 'drizzle-orm/pg-core';
import { activities } from './activities';
import { expenseParticipants } from './expense_participants';
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
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),

  /**
   * 貨幣
   */
  currency: varchar('currency', { length: 3 }).default('HKD'),

  /**
   * 創建者 Token (Member Token)
   */
  createdByToken: varchar('created_by_token', { length: 255 }).notNull(),

  /** 創建時間 */
  createdAt: timestamp('created_at').defaultNow(),
});


export const expensesRelations = relations(expenses, ({ one, many }) => ({
  activity: one(activities, {
    fields: [expenses.activityId],
    references: [activities.id],
  }),
  participants: many(expenseParticipants),
}));