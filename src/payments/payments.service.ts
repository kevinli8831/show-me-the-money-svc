import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const [payment] = await this.db
      .insert(schema.payments)
      .values(createPaymentDto)
      .returning();
    return payment;
  }

  async findAll() {
    return this.db.query.payments.findMany();
  }

  async findOne(id: number) {
    return this.db.query.payments.findFirst({
      where: eq(schema.payments.id, id),
    });
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const [payment] = await this.db
      .update(schema.payments)
      .set(updatePaymentDto)
      .where(eq(schema.payments.id, id))
      .returning();
    return payment;
  }

  async remove(id: number) {
    const [payment] = await this.db
      .delete(schema.payments)
      .where(eq(schema.payments.id, id))
      .returning();
    return payment;
  }
}
