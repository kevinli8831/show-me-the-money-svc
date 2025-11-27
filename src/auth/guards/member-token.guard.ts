import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../drizzle/schema';
import { DrizzleAsyncProvider } from '../../drizzle/drizzle.provider';

@Injectable()
export class MemberTokenGuard implements CanActivate {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tripId = request.params.tripId || request.params.id; // Support both :tripId and :id
    const memberToken = request.headers['x-member-token'];

    if (!tripId) {
      // If no tripId in params, maybe it's in body or query?
      // For now, we strictly require it in params for routes using this guard.
      // But some routes might be /trips/:id/...
      // If the route is not trip-specific, this guard shouldn't be used or should be optional.
      return true; 
    }

    if (!memberToken) {
      throw new UnauthorizedException('Missing x-member-token header');
    }

    // Find the member
    const [member] = await this.db.select().from(schema.tripMembers).where(
      and(
        eq(schema.tripMembers.tripId, Number(tripId)),
        eq(schema.tripMembers.memberToken, memberToken),
      ),
    );

    if (!member) {
      throw new UnauthorizedException('Invalid member token for this trip');
    }

    // Attach member to request
    request.member = member;
    return true;
  }
}
