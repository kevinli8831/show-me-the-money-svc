import { pgTable, bigserial, bigint, varchar, decimal, timestamp } from 'drizzle-orm/pg-core';
import { activities } from './activities';
import { relations } from 'drizzle-orm';

/**
 * Settlements Table Schema - 結算記錄資料表
 * 
 * 用途：
 * - 記錄 activity 入面嘅結算 (已付款) 記錄
 * - 支援 Token (Member Token)
 */
export const settlements = pgTable('settlements', {
  /** Primary Key */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /** 連結到 Activity (結算是針對整個活動的) */
  activityId: bigint('activity_id', { mode: 'number' }).notNull().references(() => activities.id, { onDelete: 'cascade' }),

  /** 付款人 Token (Payer) */
  payerToken: varchar('payer_token', { length: 255 }).notNull(),

  /** 收款人 Token (Receiver) */
  receiverToken: varchar('receiver_token', { length: 255 }).notNull(),

  /** 結算金額 (已支付的金額) */
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

  /** 備註 (可選，例如: "預付晚餐費") */
  description: varchar('description', { length: 255 }),

  /** 結算時間 */
  createdAt: timestamp('created_at').defaultNow(),
});

export const settlementsRelations = relations(settlements, ({ one }) => ({
  activity: one(activities, {
    fields: [settlements.activityId],
    references: [activities.id],
  }),
}));
