import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const [user] = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();
    return user;
  }

  async findAll() {
    return this.db.query.users.findMany();
  }

  async findOne(id: number) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const [user] = await this.db
      .update(schema.users)
      .set(updateUserDto)
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async remove(id: number) {
    const [user] = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }
}
