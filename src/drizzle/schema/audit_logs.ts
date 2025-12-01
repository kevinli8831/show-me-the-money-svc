import { pgTable, bigserial, varchar, bigint, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  action: varchar('action', { length: 50 }).notNull(), // e.g., 'CREATE_EXPENSE', 'ADD_MEMBER'
  entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'TRIP', 'EXPENSE'
  entityId: bigint('entity_id', { mode: 'number' }).notNull(), // e.g., tripId or expenseId
  tripId: bigint('trip_id', { mode: 'number' }), // Optional: for easier querying by trip
  performedByUserId: bigint('performed_by_user_id', { mode: 'number' }), // User who performed the action
  performedByMemberToken: varchar('performed_by_member_token').notNull(), // User who performed the action
  details: jsonb('details'), // JSON details about the change
  createdAt: timestamp('created_at').defaultNow(),
});
