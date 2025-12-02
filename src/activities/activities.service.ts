import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq, and, exists, or } from 'drizzle-orm';
import { activityMembers, activities } from '../drizzle/schema';
import * as crypto from 'crypto';

/**
 * ActivitiesService - 處理所有 Activity 相關嘅業務邏輯
 * 
 * 主要功能：
 * 1. CRUD operations (Create, Read, Update, Delete)
 * 2. 自動將 activity creator 加入做 activity member (Admin)
 * 3. 管理 activity members (add/remove)
 */
import { AuditService } from '../audit/audit.service';
import { CreateActivityMembersDto } from 'src/activitiesMembers/dto/create-activityMembers.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
    private readonly auditService: AuditService,
  ) { }

  /**
   * 創建新 Activity
   * 
   * 流程：
   * 1. 將 DTO 入面嘅 Date object 轉做 string (YYYY-MM-DD) 因為 Postgres date column 要 string
   * 2. Insert activity 到 database
   * 3. 如果有 creatorUserId，自動將佢加入做 activity member (isAdmin: true)
   * 
   * 注意：
   * - 唔使用 transaction 因為 neon-http driver 唔 support
   * - 如果 activity member 插入失敗，只會 log error，唔會影響 activity creation
   */
  async create(createActivityDto: CreateActivityDto, user?: any) {
    // 準備 activity data
    const activityData: any = {
      ...createActivityDto,
      shareCode: this.generateShareCode(),
    };

    // 將 Date object 轉做 string (YYYY-MM-DD)
    // 將 Date object 轉做 string (YYYY-MM-DD)
    const newToken = this.generateMemberToken();
    activityData.creatorMemberToken = newToken;
    // 插入 activity 到 database
    const [activity] = await this.db
      .insert(schema.activities)
      .values(activityData)
      .returning();


    // Generate Token if not provided (though usually not provided for new activity)
    // If creatorMemberToken is passed (e.g. from previous guest session), use it?
    // But here we are creating a NEW activity.
    // If the creator is a Guest, they might already have a token for ANOTHER activity.
    // But for THIS activity, they need a NEW token.
    // Wait, memberToken is per TRIP.
    // So we always generate a new one.

    const [member] = await this.db.insert(schema.activityMembers).values({
      activityId: activity.id,
      userId: user?.id,
      userName: user?.name ?? 'Guest',
      isAdmin: true,
      isGuest: !user,
      memberToken: newToken,
    }).returning();

    return { activity, member: { memberToken: newToken, name: user?.name } };
  }

  /**
   * 獲取所有 Activities
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
      // 假設你有 subquery 拉 activity_members（user 參加或創建）
      const userActivitiesSubquery = this.db
        .select({ activityId: schema.activityMembers.activityId })
        .from(schema.activityMembers)
        .where(eq(schema.activityMembers.memberToken, memberToken));

      where = or(
        eq(schema.activities.creatorMemberToken, memberToken),  // 創建人
        exists(userActivitiesSubquery)         // 或參加人
      );
    }

    // 建 with 條件（根據 include）
    const withClause: any = {};
    if (include.includes('members')) {
      withClause.activityMembers = {
        with: {
          user: true,  // 拉 user 資料
        },
        orderBy: activityMembers.joinedAt,  // 可選：按加入時間排序
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

    return this.db.query.activities.findMany({
      where,
      with: Object.keys(withClause).length > 0 ? withClause : undefined,
      orderBy: schema.activities.createdAt,  // 全局排序，按創建時間
      // limit: 20,  // 可選，加 pagination
    });
  }

  /**
   * 根據 ID 獲取單個 Activity
   * 
   * @param include - 指定要 include 咩 nested data (e.g. ['members', 'expenses'])
   */
  async findOne(id: number, include: string[] = []) {
    const activity = await this.db.query.activities.findFirst({
      where: eq(schema.activities.id, id),
      ...(include.includes('members') && {
        with: {
          activityMembers: {
            with: {
              user: true,
            },
          },
        },
      }),
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    return activity;
  }

  /**
   * 更新 Activity
   * 
   * 同樣需要處理 Date -> string 轉換
   */
  async update(id: number, memberToken: string, updateActivityDto: UpdateActivityDto, userId?: number) {
    const updateData: any = {
      ...updateActivityDto,
    };

    // 處理 Date 轉 string
    if (updateActivityDto.startDate) {
      updateData.startDate = updateActivityDto.startDate;
    }
    if (updateActivityDto.endDate) {
      updateData.endDate = updateActivityDto.endDate;
    }

    const [activity] = await this.db
      .update(schema.activities)
      .set(updateData)
      .where(eq(schema.activities.id, id))
      .returning();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    // Log audit
    await this.auditService.log({
      action: 'UPDATE_TRIP',
      entityType: 'ACTIVITIES',
      entityId: activity.id,
      activityId: activity.id,
      performedByMemberToken: memberToken,
      performedByUserId: userId,
      details: updateData,
    });

    return activity;
  }

  /**
   * 刪除 Activity
   * 
   * 注意：因為 activity_members 有 onDelete: 'cascade'，
   * 刪除 activity 會自動刪除所有相關嘅 activity members
   */
  async remove(id: number, memberToken: string, userId?: number) {
    const [activity] = await this.db
      .delete(schema.activities)
      .where(eq(schema.activities.id, id))
      .returning() as any[];

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    // Log audit
    await this.auditService.log({
      action: 'DELETE_TRIP',
      entityType: 'ACTIVITIES',
      entityId: activity.id,
      activityId: activity.id,
      performedByMemberToken: memberToken,
      performedByUserId: userId,
    });

    return activity;
  }

  /**
   * 加人入 Activity
   * 
   * 用途：比其他 user join 個 activity
   * 例如：POST /activities/1/members { "userId": 2 }
   */
  async addMember(activityId: number, createActivityMembersDto: CreateActivityMembersDto) {

    // 插入 activity member，預設唔係 Admin
    await this.db.insert(schema.activityMembers).values({
      activityId,
      userId: createActivityMembersDto.userId,
      userName: createActivityMembersDto.userName,
      isAdmin: createActivityMembersDto.isAdmin,
      joinedAt: new Date(),
      isVirtual: !createActivityMembersDto.userId,
      isGuest: !createActivityMembersDto.userId,
      memberToken: this.generateMemberToken(),
    });

    return { message: 'Member added successfully' };
  }

  /**
   * 踢人出 Activity
   * 
   * 用途：將 user 從 activity 移除
   * 例如：DELETE /activities/1/members/2
   */
  async removeMember(activityId: number, userId: number) {
    const result = await this.db
      .delete(schema.activityMembers)
      .where(
        and(
          eq(schema.activityMembers.activityId, activityId),
          eq(schema.activityMembers.userId, userId),
        ),
      )
      .returning();

    if (result.length === 0) {
      throw new NotFoundException(
        `Member with User ID ${userId} not found in Activity ${activityId}`,
      );
    }

    return { message: 'Member removed successfully' };
  }
  /**
   * 生成 Member Token
   * 格式: mt- + 8位 alphanumeric
   */
  private generateMemberToken(): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const length = 8;
    let result = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      const index = randomBytes[i] % characters.length;
      result += characters[index];
    }

    return `mt-${result}`;
  }

  /**
   * Join Activity (Guest)
   * 
   * 用途：任何人點 Link 直接入團
   * 
   * 流程：
   * 1. Check activity exists
   * 2. Create Guest User
   * 3. Create Activity Member (isGuest=true)
   * 4. Return memberToken
   */
  async join(activityId: number, userName: string = 'Guest') {
    const activity = await this.findOne(activityId); // Ensure activity exists

    // Create Guest User
    const [guestUser] = await this.db.insert(schema.users).values({
      name: userName,
      userType: 'guest',
    }).returning() as any[];

    // Generate Token
    const memberToken = this.generateMemberToken();

    // Create Activity Member
    const [member] = await this.db.insert(schema.activityMembers).values({
      activityId,
      userId: guestUser.id,
      userName: userName,
      isAdmin: false,
      isGuest: true,
      memberToken: memberToken,
    }).returning() as any[];

    return { activity, memberToken: member.memberToken };
  }

  /**
   * 生成 8 位 Base62 Share Code
   * 
   * 空間: 62^8 = ~218 trillion combinations
   * 碰撞機率極低
   */
  private generateShareCode(): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const length = 8;
    let result = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      // 使用 modulo 運算，雖然有輕微 bias 但對 share code 影響可忽略
      const index = randomBytes[i] % characters.length;
      result += characters[index];
    }

    return result;
  }

  /**
   * 根據 Share Code 獲取單個 Activity
   * 
   * @param include - 指定要 include 咩 nested data (e.g. ['members', 'expenses'])
   */
  async findByShareCode(shareCode: string, include: string[] = []) {
    const withClause: any = {};
    if (include.includes('members')) {
      withClause.activityMembers = {
        with: {
          user: true,
        },
        orderBy: activityMembers.joinedAt,
      };
    }
    if (include.includes('expenses')) {
      withClause.expenses = {
        with: {
          // user: true, // expenses table doesn't have direct user relation, it uses arrays
        },
        orderBy: schema.expenses.createdAt,
      };
    }

    const activity = await this.db.query.activities.findFirst({
      where: eq(schema.activities.shareCode, shareCode),
      with: Object.keys(withClause).length > 0 ? withClause : undefined,
    });

    if (!activity) {
      throw new NotFoundException(`Activity with Share Code ${shareCode} not found`);
    }

    return activity;
  }
}
