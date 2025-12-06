import { pgTable, bigserial, bigint, varchar, decimal } from 'drizzle-orm/pg-core';
import { expenses } from './expenses';
import { relations } from 'drizzle-orm';

/**
 * 帳單明細表 (Expense Participants / Splits)
 * 每一行代表一個人在這筆帳單中的角色（付了多少、該付多少）
 */
export const expenseParticipants = pgTable('expense_participants', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /** 
   * 連結到主帳單 
   */
  expenseId: bigint('expense_id', { mode: 'number' })
    .notNull()
    .references(() => expenses.id, { onDelete: 'cascade' }),

  /** 
   * 參與者 Token 
   */
  memberToken: varchar('member_token', { length: 255 }).notNull(),

  /** 
   * 實際付款金額 (Paid)
   * 例如：某人代墊了 $100，這裡就是 100.00
   */
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0').notNull(),

  /** 
   * 應付金額 (Owed / Share)
   * 例如：這餐 AA 制，他該付 $50，這裡就是 50.00
   */
  owedAmount: decimal('owed_amount', { precision: 12, scale: 2 }).default('0').notNull(),
});

export const expenseParticipantsRelations = relations(expenseParticipants, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseParticipants.expenseId],
    references: [expenses.id],
  }),
}));
