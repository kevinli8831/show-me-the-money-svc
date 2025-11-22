import { Inject, Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto) {
    const [expense] = await this.db
      .insert(schema.expenses)
      .values(createExpenseDto)
      .returning();
    return expense;
  }

  async findAll() {
    return this.db.query.expenses.findMany();
  }

  async findOne(id: number) {
    return this.db.query.expenses.findFirst({
      where: eq(schema.expenses.id, id),
    });
  }

  async update(id: number, updateExpenseDto: UpdateExpenseDto) {
    const [expense] = await this.db
      .update(schema.expenses)
      .set(updateExpenseDto)
      .where(eq(schema.expenses.id, id))
      .returning();
    return expense;
  }

  async remove(id: number) {
    const [expense] = await this.db
      .delete(schema.expenses)
      .where(eq(schema.expenses.id, id))
      .returning();
    return expense;
  }
}
