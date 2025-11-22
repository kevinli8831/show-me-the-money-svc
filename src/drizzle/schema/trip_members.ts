import { pgTable, bigint, boolean, timestamp, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { trips } from './trips';
import { users } from './users';

export const tripMembers = pgTable('trip_members', {
  tripId: bigint('trip_id', { mode: 'number' }).notNull().references(() => trips.id, { onDelete: 'cascade' }),
  userName: varchar('user_name', { length: 100 }).notNull(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id),
  isAdmin: boolean('is_admin').default(false),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.tripId, t.userId] }),
}));
