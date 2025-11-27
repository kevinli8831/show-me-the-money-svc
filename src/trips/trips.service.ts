import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq, and, exists, or } from 'drizzle-orm';
import { tripMembers, trips } from '../drizzle/schema';
import * as crypto from 'crypto';

/**
 * TripsService - 處理所有 Trip 相關嘅業務邏輯
 * 
 * 主要功能：
 * 1. CRUD operations (Create, Read, Update, Delete)
 * 2. 自動將 trip creator 加入做 trip member (Admin)
 * 3. 管理 trip members (add/remove)
 */
@Injectable()
export class TripsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) { }

  /**
   * 創建新 Trip
   * 
   * 流程：
   * 1. 將 DTO 入面嘅 Date object 轉做 string (YYYY-MM-DD) 因為 Postgres date column 要 string
   * 2. Insert trip 到 database
   * 3. 如果有 creatorUserId，自動將佢加入做 trip member (isAdmin: true)
   * 
   * 注意：
   * - 唔使用 transaction 因為 neon-http driver 唔 support
   * - 如果 trip member 插入失敗，只會 log error，唔會影響 trip creation
   */
  async create(createTripDto: CreateTripDto, user?: any) {
    // 準備 trip data
    const tripData: any = {
      ...createTripDto,
    };

    // 將 Date object 轉做 string (YYYY-MM-DD)
    if (createTripDto.startDate) {
      tripData.startDate = createTripDto.startDate.toISOString().split('T')[0];
    }
    if (createTripDto.endDate) {
      tripData.endDate = createTripDto.endDate.toISOString().split('T')[0];
    }
    const newToken = crypto.randomUUID();
    // 插入 trip 到 database
    const [trip] = await this.db
      .insert(schema.trips)
      .values(tripData)
      .returning() as any[];

    tripData.creatorMemberToken = newToken;

    // Generate Token if not provided (though usually not provided for new trip)
    // If creatorMemberToken is passed (e.g. from previous guest session), use it?
    // But here we are creating a NEW trip.
    // If the creator is a Guest, they might already have a token for ANOTHER trip.
    // But for THIS trip, they need a NEW token.
    // Wait, memberToken is per TRIP.
    // So we always generate a new one.

    const [member] = await this.db.insert(schema.tripMembers).values({
      tripId: trip.id,
      userId: user?.id,
      userName: user?.name,
      isAdmin: true,
      isGuest: !user,
      memberToken: newToken,
    }).returning() as any[];

    return { trip, member: { memberToken: newToken, name: user?.name } };
  }

  /**
   * 獲取所有 Trips
   * 
   * @param include - 指定要 include 咩 nested data (e.g. ['members', 'expenses'])
   * 
   * 例子:
   * findAll([]) -> 只要基本資料
   * findAll(['members']) -> 包括 members
   * findAll(['members', 'expenses']) -> 包括 members 同 expenses
   */
  async findAll(include: string[] = [], memberToken?: string) {
    // 建 where 條件（filter by userId）
    let where: any = undefined;
    if (memberToken) {
      // 假設你有 subquery 拉 trip_members（user 參加或創建）
      const userTripsSubquery = this.db
        .select({ tripId: schema.tripMembers.tripId })
        .from(schema.tripMembers)
        .where(eq(schema.tripMembers.memberToken, memberToken));

      where = or(
        eq(schema.trips.creatorMemberToken, memberToken),  // 創建人
        exists(userTripsSubquery)         // 或參加人
      );
    }

    // 建 with 條件（根據 include）
    const withClause: any = {};
    if (include.includes('members')) {
      withClause.tripMembers = {
        with: {
          user: true,  // 拉 user 資料
        },
        orderBy: tripMembers.joinedAt,  // 可選：按加入時間排序
      };
    }
    if (include.includes('expense')) {
      withClause.expense = {
        with: {
          user: true,  // 拉 user 資料
        },
        orderBy: schema.expenses.createdAt,  // 可選：按加入時間排序
      };
    }
    // 可以加其他 include e.g. if (include.includes('expenses')) { withClause.expenses = { ... }; }

    return this.db.query.trips.findMany({
      where,
      with: Object.keys(withClause).length > 0 ? withClause : undefined,
      orderBy: schema.trips.createdAt,  // 全局排序，按創建時間
      // limit: 20,  // 可選，加 pagination
    });
  }

  /**
   * 根據 ID 獲取單個 Trip
   * 
   * @param include - 指定要 include 咩 nested data (e.g. ['members', 'expenses'])
   */
  async findOne(id: number, include: string[] = []) {
    const trip = await this.db.query.trips.findFirst({
      where: eq(schema.trips.id, id),
      ...(include.includes('members') && {
        with: {
          tripMembers: {
            with: {
              user: true,
            },
          },
        },
      }),
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }

  /**
   * 更新 Trip
   * 
   * 同樣需要處理 Date -> string 轉換
   */
  async update(id: number, updateTripDto: UpdateTripDto) {
    const updateData: any = {
      ...updateTripDto,
    };

    // 處理 Date 轉 string
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
      .returning() as any[];

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }

  /**
   * 刪除 Trip
   * 
   * 注意：因為 trip_members 有 onDelete: 'cascade'，
   * 刪除 trip 會自動刪除所有相關嘅 trip members
   */
  async remove(id: number) {
    const [trip] = await this.db
      .delete(schema.trips)
      .where(eq(schema.trips.id, id))
      .returning() as any[];

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }

  /**
   * 加人入 Trip
   * 
   * 用途：比其他 user join 個 trip
   * 例如：POST /trips/1/members { "userId": 2 }
   */
  async addMember(tripId: number, userId: number) {
    // 先搵個 user 嚟拎 name
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 插入 trip member，預設唔係 Admin
    await this.db.insert(schema.tripMembers).values({
      tripId,
      userId,
      userName: user.name,
      isAdmin: false,
    });

    return { message: 'Member added successfully' };
  }

  /**
   * 踢人出 Trip
   * 
   * 用途：將 user 從 trip 移除
   * 例如：DELETE /trips/1/members/2
   */
  async removeMember(tripId: number, userId: number) {
    const result = await this.db
      .delete(schema.tripMembers)
      .where(
        and(
          eq(schema.tripMembers.tripId, tripId),
          eq(schema.tripMembers.userId, userId),
        ),
      )
      .returning() as any[];

    if (result.length === 0) {
      throw new NotFoundException(
        `Member with User ID ${userId} not found in Trip ${tripId}`,
      );
    }

    return { message: 'Member removed successfully' };
  }
  /**
   * 生成 Member Token
   * 格式: mt + 16位 Base64Url
   */
  private generateMemberToken(): string {
    const buffer = crypto.randomBytes(12); // 12 bytes = 96 bits
    const base64Url = buffer.toString('base64url'); // ~16 chars
    return `mt_${base64Url}`;
  }

  /**
   * Join Trip (Guest)
   * 
   * 用途：任何人點 Link 直接入團
   * 
   * 流程：
   * 1. Check trip exists
   * 2. Create Guest User
   * 3. Create Trip Member (isGuest=true)
   * 4. Return memberToken
   */
  async join(tripId: number, userName: string = 'Guest') {
    const trip = await this.findOne(tripId); // Ensure trip exists

    // Create Guest User
    const [guestUser] = await this.db.insert(schema.users).values({
      name: userName,
      userType: 'guest',
    }).returning() as any[];

    // Generate Token
    const memberToken = this.generateMemberToken();

    // Create Trip Member
    const [member] = await this.db.insert(schema.tripMembers).values({
      tripId,
      userId: guestUser.id,
      userName: userName,
      isAdmin: false,
      isGuest: true,
      memberToken: memberToken,
    }).returning() as any[];

    return { trip, memberToken: member.memberToken };
  }
}
