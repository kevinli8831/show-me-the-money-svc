import { pgTable, bigserial, bigint, varchar, decimal, char, date, text, timestamp } from 'drizzle-orm/pg-core';
import { trips } from './trips';
import { users } from './users';

export const expenses = pgTable('expenses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tripId: bigint('trip_id', { mode: 'number' }).notNull().references(() => trips.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: char('currency', { length: 3 }),
  category: varchar('category', { length: 50 }),
  note: text('note'),
  receiptImageUrl: text('receipt_image_url'),
  createdBy: bigint('created_by', { mode: 'number' }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
