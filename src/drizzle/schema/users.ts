import { pgTable, bigserial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).unique(),
  avatarUrl: text('avatar_url'),
  isRegistered: boolean('is_registered').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
