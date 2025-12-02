import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { DrizzleAsyncProvider } from '../../drizzle/drizzle.provider';

@Injectable()
export class MemberTokenGuard implements CanActivate {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const activityId = request.params.activityId || request.params.id; // Support both :activityId and :id
    const memberToken = request.headers['x-member-token'];

    if (!activityId) {
      // If no activityId in params, maybe it's in body or query?
      // For now, we strictly require it in params for routes using this guard.
      // But some routes might be /activities/:id/...
      // If the route is not activity-specific, this guard shouldn't be used or should be optional.
      return true;
    }

    if (!memberToken) {
      throw new UnauthorizedException('Missing x-member-token header');
    }

    // Find the member
    const [member] = await this.db.select().from(schema.activityMembers).where(
      and(
        eq(schema.activityMembers.activityId, Number(activityId)),
        eq(schema.activityMembers.memberToken, memberToken),
      ),
    );

    if (!member) {
      throw new UnauthorizedException('Invalid member token for this activity');
    }

    // Attach member to request
    request.member = member;
    return true;
  }
}
