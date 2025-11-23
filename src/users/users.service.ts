import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

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
  /**
   * 創建 User (支援虛擬成員)
   * 
   * 如果 isVirtual = true，只需要 name
   * 如果 isVirtual = false，需要 email/OAuth 資料
   */
  async create(createUserDto: CreateUserDto) {
    const [user] = await this.db
      .insert(schema.users)
      .values(createUserDto)
      .returning() as any[];
    return user;
  }

  /**
   * 創建虛擬成員
   * 
   * 虛擬成員只有名字，無 email/provider
   * 用於暫時記錄未註冊嘅成員
   */
  async createVirtualUser(name: string, createdBy: number) {
    const [user] = await this.db
      .insert(schema.users)
      .values({
        name,
        isVirtual: true,
        createdBy,
      })
      .returning() as any[];
    return user;
  }

  /**
   * 搵某個 Trip 入面嘅所有虛擬成員
   */
  async findVirtualUsersByTrip(tripId: number) {
    const members = await this.db
      .select({ user: schema.users })
      .from(schema.tripMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.tripMembers.userId))
      .where(
        and(
          eq(schema.tripMembers.tripId, tripId),
          eq(schema.users.isVirtual, true),
        ),
      );
    return members.map(m => m.user);
  }

  /**
   * 認領虛擬成員
   * 
   * 當真人註冊後，可以 claim 之前嘅虛擬成員
   * 1. 將所有 trip_members 由 virtual user 轉去 real user
   * 2. 將所有 expense_splits 由 virtual user 轉去 real user
   * 3. 將所有 expense_payers 由 virtual user 轉去 real user
   * 4. 標記 virtual user 已被 claim
   */
  async claimVirtualUser(virtualUserId: number, realUserId: number, tripId: number) {
    // 1. Update trip_members
    await this.db
      .update(schema.tripMembers)
      .set({ userId: realUserId })
      .where(
        and(
          eq(schema.tripMembers.userId, virtualUserId),
          eq(schema.tripMembers.tripId, tripId),
        ),
      );

    // 2. Update expense_splits (所有 trip 入面嘅 expenses)
    const tripExpenses = await this.db
      .select({ id: schema.expenses.id })
      .from(schema.expenses)
      .where(eq(schema.expenses.tripId, tripId));
    
    const expenseIds = tripExpenses.map(e => e.id);
    
    if (expenseIds.length > 0) {
      await this.db
        .update(schema.expenseSplits)
        .set({ userId: realUserId })
        .where(
          and(
            eq(schema.expenseSplits.userId, virtualUserId),
            // expenseId in expenseIds
          ),
        );

      // 3. Update expense_payers
      await this.db
        .update(schema.expensePayers)
        .set({ userId: realUserId })
        .where(
          and(
            eq(schema.expensePayers.userId, virtualUserId),
            // expenseId in expenseIds
          ),
        );
    }

    // 4. Mark virtual user as claimed
    await this.db
      .update(schema.users)
      .set({ claimedBy: realUserId })
      .where(eq(schema.users.id, virtualUserId));

    return { success: true };
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
      .returning() as any[];

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
      .returning() as any[];

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
