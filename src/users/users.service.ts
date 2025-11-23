import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * UsersService - 處理所有 User 相關嘅業務邏輯
 * 
 * 主要功能：
 * - CRUD operations (Create, Read, Update, Delete)
 * - 管理 user 資料
 */
@Injectable()
export class UsersService {
  /**
   * Constructor - 注入 Drizzle database instance
   * 
   * @Inject(DrizzleAsyncProvider) 會從 DrizzleModule 拎到 database connection
   * NeonHttpDatabase 係 Drizzle 嘅 type，用 neon-http driver 連接 NeonDB
   */
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  /**
   * 創建新 User
   * 
   * 流程：
   * 1. 用 Drizzle 嘅 insert() method 插入 user
   * 2. values() 接收 DTO object
   * 3. returning() 會 return 返剛插入嘅 record
   * 
   * 例子：
   * createUserDto = { name: "Kevin", email: "kevin@example.com" }
   * -> INSERT INTO users (name, email) VALUES ('Kevin', 'kevin@example.com') RETURNING *
   */
  async create(createUserDto: CreateUserDto) {
    const [user] = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning();
    return user;
  }

  /**
   * 獲取所有 Users
   * 
   * 用 Drizzle query API 嘅 findMany()
   * -> SELECT * FROM users
   */
  async findAll() {
    return this.db.query.users.findMany();
  }

  /**
   * 根據 ID 獲取單個 User
   * 
   * where: eq(schema.users.id, id) 係 Drizzle 嘅 query builder
   * eq() = equals，即係 WHERE id = ?
   * 
   * 例子：
   * findOne(1) -> SELECT * FROM users WHERE id = 1 LIMIT 1
   */
  async findOne(id: number) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * 更新 User
   * 
   * 流程：
   * 1. update(schema.users) 指定要 update 邊個 table
   * 2. set(updateUserDto) 設定要 update 嘅 fields
   * 3. where() 指定要 update 邊個 record
   * 4. returning() return 返 updated record
   * 
   * 例子：
   * update(1, { name: "New Name" })
   * -> UPDATE users SET name = 'New Name' WHERE id = 1 RETURNING *
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const [user] = await this.db
      .update(schema.users)
      .set(updateUserDto)
      .where(eq(schema.users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * 刪除 User
   * 
   * 流程：
   * 1. delete(schema.users) 指定要 delete 邊個 table
   * 2. where() 指定要 delete 邊個 record
   * 3. returning() return 返 deleted record
   * 
   * 例子：
   * remove(1) -> DELETE FROM users WHERE id = 1 RETURNING *
   */
  async remove(id: number) {
    const [user] = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
