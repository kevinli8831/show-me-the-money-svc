import { pgTable, bigserial, bigint, decimal, char, timestamp, text } from 'drizzle-orm/pg-core';
import { trips } from './trips';
import { users } from './users';

export const payments = pgTable('payments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tripId: bigint('trip_id', { mode: 'number' }).notNull().references(() => trips.id, { onDelete: 'cascade' }),
  fromUserId: bigint('from_user_id', { mode: 'number' }).notNull().references(() => users.id),
  toUserId: bigint('to_user_id', { mode: 'number' }).notNull().references(() => users.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }).default('HKD'),
  paidAt: timestamp('paid_at').defaultNow(),
  note: text('note'),
});
