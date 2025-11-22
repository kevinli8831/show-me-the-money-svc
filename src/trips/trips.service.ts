import { Inject, Injectable } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TripsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createTripDto: CreateTripDto) {
    const [trip] = await this.db
      .insert(schema.trips)
      .values(createTripDto)
      .returning();
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
    const [trip] = await this.db
      .update(schema.trips)
      .set(updateTripDto)
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
}
