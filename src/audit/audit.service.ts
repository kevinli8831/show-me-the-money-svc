
import { Inject, Injectable } from '@nestjs/common';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';

@Injectable()
export class AuditService {
  constructor(@Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>) { }

  async log(params: {
    action: string;
    entityType: 'ACTIVITIES' | 'EXPENSE' | 'MEMBER';
    entityId: number;
    activityId?: number;
    performedByUserId?: number;
    performedByMemberToken: string;
    details?: any;
  }) {
    await this.db.insert(schema.auditLogs).values({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      activityId: params.activityId,
      performedByUserId: params.performedByUserId,
      performedByMemberToken: params.performedByMemberToken,
      details: params.details,
      createdAt: new Date(),
    });
  }
}
