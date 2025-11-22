import { Inject, Injectable } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class TripsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createTripDto: CreateTripDto) {
    const tripData: any = {
      ...createTripDto,
    };

    if (createTripDto.startDate) {
      tripData.startDate = createTripDto.startDate.toISOString().split('T')[0];
    }
    if (createTripDto.endDate) {
      tripData.endDate = createTripDto.endDate.toISOString().split('T')[0];
    }

    const [trip] = await this.db
      .insert(schema.trips)
      .values(tripData)
      .returning();

    if (createTripDto.creatorUserId) {
      try {
        const user = await this.db.query.users.findFirst({
          where: eq(schema.users.id, createTripDto.creatorUserId),
        });

        if (user) {
          await this.db.insert(schema.tripMembers).values({
            tripId: trip.id,
            userId: createTripDto.creatorUserId,
            userName: user.name,
            isAdmin: true,
          });
        }
      } catch (error) {
        console.error('[TripsService] Error creating trip member:', error);
        // Don't throw - we still want to return the trip even if member creation fails
      }
    }

    return trip;
  }

  async findAll() {
    return this.db.query.trips.findMany();
  }

  async findOne(id: number) {
    return this.db.query.trips.findFirst({
      where: eq(schema.trips.id, id),
    });
  }

  async update(id: number, updateTripDto: UpdateTripDto) {
    const updateData: any = {
      ...updateTripDto,
    };

    if (updateTripDto.startDate) {
      updateData.startDate = updateTripDto.startDate.toISOString().split('T')[0];
    }
    if (updateTripDto.endDate) {
      updateData.endDate = updateTripDto.endDate.toISOString().split('T')[0];
    }

    const [trip] = await this.db
      .update(schema.trips)
      .set(updateData)
      .where(eq(schema.trips.id, id))
      .returning();
    return trip;
  }

  async remove(id: number) {
    const [trip] = await this.db
      .delete(schema.trips)
      .where(eq(schema.trips.id, id))
      .returning();
    return trip;
  }

  async addMember(tripId: number, userId: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.db.insert(schema.tripMembers).values({
      tripId,
      userId,
      userName: user.name,
      isAdmin: false,
    });

    return { message: 'Member added successfully' };
  }

  async removeMember(tripId: number, userId: number) {
    await this.db
      .delete(schema.tripMembers)
      .where(
        and(
          eq(schema.tripMembers.tripId, tripId),
          eq(schema.tripMembers.userId, userId),
        ),
      );

    return { message: 'Member removed successfully' };
  }
}
