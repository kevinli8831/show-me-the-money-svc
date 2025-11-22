import { pgTable, bigserial, bigint, decimal, varchar, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { expenses } from './expenses';
import { users } from './users';

export const expenseSplits = pgTable('expense_splits', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  expenseId: bigint('expense_id', { mode: 'number' }).notNull().references(() => expenses.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id),
  shareAmount: decimal('share_amount', { precision: 12, scale: 2 }),
  percentage: decimal('percentage', { precision: 5, scale: 4 }),
  splitMethod: varchar('split_method', { length: 20 }).default('equal'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  unq: unique().on(t.expenseId, t.userId),
}));
