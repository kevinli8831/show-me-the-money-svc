import { pgTable, bigserial, varchar, text, date, timestamp, bigint } from 'drizzle-orm/pg-core';
import { users } from './users';

export const trips = pgTable('trips', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  creatorUserId: bigint('creator_user_id', { mode: 'number' }).references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});
