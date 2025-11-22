import { pgTable, bigserial, bigint, decimal, unique } from 'drizzle-orm/pg-core';
import { expenses } from './expenses';
import { users } from './users';

export const expensePayers = pgTable('expense_payers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  expenseId: bigint('expense_id', { mode: 'number' }).notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).notNull(),
}, (t) => ({
  unq: unique().on(t.expenseId, t.userId),
}));
