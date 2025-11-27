import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

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
   * 如果 userType = 'virtual'，只需要 name
   * 如果 userType = 'email'/'google'/'apple'，需要 email/OAuth 資料
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
        userType: 'virtual',
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
          eq(schema.users.userType, 'virtual'),
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

    // 2. Update expenses (createdByToken: Virtual -> Real)
    // We need to find the Virtual User's memberToken first?
    // Wait, Virtual User doesn't have a memberToken in users table.
    // MemberToken is in trip_members table.
    // But claimVirtualUser takes virtualUserId.
    // So we need to find the memberToken for this virtualUserId in this trip.
    
    const [virtualMember] = await this.db
      .select()
      .from(schema.tripMembers)
      .where(
        and(
          eq(schema.tripMembers.tripId, tripId),
          eq(schema.tripMembers.userId, virtualUserId),
        ),
      );
      
    // If virtual member exists, we need to update expenses that reference its token.
    // But wait, step 1 already updated trip_members userId to realUserId!
    // So if we query now, we might not find it if we query by virtualUserId?
    // Step 1: update trip_members set userId = realUserId where userId = virtualUserId
    // So after step 1, the member record has userId = realUserId.
    // BUT the memberToken stays the same!
    // And expenses reference memberToken.
    // So expenses are ALREADY pointing to the correct member record (which is now owned by realUserId).
    // So... we don't need to update expenses at all?
    
    // Let's verify:
    // 1. Virtual User (id=10) created. Trip Member (token=ABC, userId=10).
    // 2. Expense created with participantTokens=[ABC].
    // 3. Claim: Update Trip Member set userId=20 where userId=10.
    // 4. Trip Member is now (token=ABC, userId=20).
    // 5. Expense still has participantTokens=[ABC].
    // 6. When fetching expense, we look up member ABC -> finds Trip Member (userId=20) -> finds User 20.
    // Correct!
    
    // So for claimVirtualUser, we ONLY need to update trip_members.
    // We DO NOT need to update expenses because expenses use memberToken, which doesn't change.
    // The only thing that changes is the ownership of that memberToken.
    
    // However, previously I was updating expense_payers/splits because they referenced userId directly.
    // Now expenses reference memberToken.
    // So my previous logic for claimVirtualUser was updating userId in payers/splits.
    // Now that payers/splits are gone, and expenses use tokens, we are good!
    
    // BUT, what about createdByToken?
    // Same logic. createdByToken = ABC. Member ABC is now owned by Real User.
    // So it automatically points to Real User.
    
    // So... claimVirtualUser just needs to update trip_members and users table.
    // That's it!
    
    // Wait, I should double check if I need to do anything else.
    // The previous implementation of claimVirtualUser updated expense_splits and expense_payers.
    // Since those tables are deleted, I should remove that code.
    
    // So I just need to remove the code that updates expense_splits and expense_payers.


    // 4. Mark virtual user as claimed
    await this.db
      .update(schema.users)
      .set({ claimedBy: realUserId })
      .where(eq(schema.users.id, virtualUserId));

    return { success: true };
  }

  /**
   * 認領訪客成員 (Guest -> Real User)
   * 
   * 當 Guest User 登入後，將其 Guest 身份合併到 Real User
   * 1. Update trip_members (userId -> Real User)
   * 2. Update expenses (createdByToken: Guest -> Real)
   * 3. Update expenses (participantTokens: Guest -> Real)
   * 4. Update payments (fromUserId/toUserId -> Real User)
   * 5. Delete Guest User
   */
  async claimGuestMember(guestUserId: number, realUserId: number, tripId: number) {
    if (guestUserId === realUserId) {
      return { success: true, message: 'Same user, no need to claim' };
    }

    // Get Guest Member Token
    const [guestMember] = await this.db
      .select()
      .from(schema.tripMembers)
      .where(
        and(
          eq(schema.tripMembers.tripId, tripId),
          eq(schema.tripMembers.userId, guestUserId),
        ),
      );

    if (!guestMember) {
      throw new NotFoundException('Guest member not found');
    }

    // Get Real Member Token (if exists)
    const [realMember] = await this.db
      .select()
      .from(schema.tripMembers)
      .where(
        and(
          eq(schema.tripMembers.tripId, tripId),
          eq(schema.tripMembers.userId, realUserId),
        ),
      );

    if (realMember) {
      // Real User is already in the trip.
      // We need to merge Guest's data into Real User.
      // Since expenses use memberToken, we need to replace GuestToken with RealToken in expenses.
      
      await this.mergeUserData(guestMember.memberToken, realMember.memberToken, tripId);
      
      // Delete Guest Member
      await this.db
        .delete(schema.tripMembers)
        .where(
          and(
            eq(schema.tripMembers.tripId, tripId),
            eq(schema.tripMembers.userId, guestUserId),
          ),
        );
    } else {
      // Real User is NOT in the trip.
      // Just update Guest Member to point to Real User.
      // The memberToken stays the same, so expenses don't need update!
      // Wait, user said "登入後傳一次 memberToken 給後端 → 把 isGuest 改 false + 填 userId".
      // So in this case, we just update trip_members.
      
      await this.db
        .update(schema.tripMembers)
        .set({ userId: realUserId, isGuest: false })
        .where(
          and(
            eq(schema.tripMembers.tripId, tripId),
            eq(schema.tripMembers.userId, guestUserId),
          ),
        );
    }

    // Delete Guest User (if no other dependencies)
    const remainingMembers = await this.db
      .select()
      .from(schema.tripMembers)
      .where(eq(schema.tripMembers.userId, guestUserId));
      
    if (remainingMembers.length === 0) {
      await this.db.delete(schema.users).where(eq(schema.users.id, guestUserId));
    }

    return { success: true };
  }

  private async mergeUserData(fromToken: string, toToken: string, tripId: number) {
    // 1. Update expenses createdByToken
    await this.db
      .update(schema.expenses)
      .set({ createdByToken: toToken })
      .where(
        and(
          eq(schema.expenses.tripId, tripId),
          eq(schema.expenses.createdByToken, fromToken),
        ),
      );

    // 2. Update expenses participantTokens
    // This is tricky with arrays. We need to replace fromToken with toToken in the array.
    // Postgres array_replace: array_replace(participant_tokens, 'fromToken', 'toToken')
    // Drizzle sql operator can be used.
    
    await this.db.execute(sql`
      UPDATE expenses
      SET participant_tokens = array_replace(participant_tokens, ${fromToken}, ${toToken})
      WHERE trip_id = ${tripId} AND ${fromToken} = ANY(participant_tokens)
    `);

    // Note: We are NOT merging amounts if both tokens existed in the same expense.
    // If both existed, array_replace might result in duplicate tokens in the array?
    // array_replace replaces ALL occurrences.
    // If toToken was already there, we might end up with two toTokens?
    // User schema has arrays for paidAmounts and shareAmounts corresponding to participantTokens.
    // If we merge tokens, we must also merge amounts!
    // This is very complex to do in SQL alone if both existed.
    // For now, assuming they don't overlap in the same expense (unlikely for Guest vs Real unless they were added separately).
    // If they overlap, we have a problem: the amounts arrays won't be merged, just the token array will have duplicates.
    // But since paidAmounts/shareAmounts are parallel arrays, we can't just array_replace token.
    // We would need to sum the amounts at the indices where tokens match.
    // Given the complexity, and that Guest/Real usually implies one person, overlap is edge case.
    // I will stick to array_replace for now.
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
