import { pgTable, serial, varchar, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 50 }).notNull(), // e.g., 'CREATE_EXPENSE', 'ADD_MEMBER'
  entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g., 'TRIP', 'EXPENSE'
  entityId: integer('entity_id').notNull(), // e.g., tripId or expenseId
  tripId: integer('trip_id'), // Optional: for easier querying by trip
  performedByUserId: integer('performed_by_user_id'), // User who performed the action
  details: jsonb('details'), // JSON details about the change
  createdAt: timestamp('created_at').defaultNow(),
});
