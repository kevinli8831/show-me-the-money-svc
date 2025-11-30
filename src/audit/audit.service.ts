
import { Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';

@Injectable()
export class AuditService {
  constructor(@Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>) { }

  async log(params: {
    action: string;
    entityType: 'TRIP' | 'EXPENSE' | 'MEMBER';
    entityId: number;
    tripId?: number;
    performedByUserId?: number;
    details?: any;
  }) {
    await this.db.insert(schema.auditLogs).values({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      tripId: params.tripId,
      performedByUserId: params.performedByUserId,
      details: params.details,
      createdAt: new Date(),
    });
  }
}
