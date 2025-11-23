import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

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
  ) {}

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
  async create(createTripDto: CreateTripDto) {
    // 準備 trip data
    const tripData: any = {
      ...createTripDto,
    };

    // 將 Date object 轉做 string (YYYY-MM-DD)
    // 例如: new Date('2025-10-23') -> '2025-10-23'
    if (createTripDto.startDate) {
      tripData.startDate = createTripDto.startDate.toISOString().split('T')[0];
    }
    if (createTripDto.endDate) {
      tripData.endDate = createTripDto.endDate.toISOString().split('T')[0];
    }

    // 插入 trip 到 database，returning() 會 return 返剛插入嘅 record
    const [trip] = await this.db
      .insert(schema.trips)
      .values(tripData)
      .returning() as any[];

    // 自動將 creator 加入做 trip member (Admin)
    if (createTripDto.creatorUserId) {
      try {
        // 先搵返個 user 嚟拎佢個 name (因為 trip_members table 要 userName)
        const user = await this.db.query.users.findFirst({
          where: eq(schema.users.id, createTripDto.creatorUserId),
        });

        if (user) {
          // 插入 trip member record
          await this.db.insert(schema.tripMembers).values({
            tripId: trip.id,
            userId: createTripDto.creatorUserId,
            userName: user.name,
            isAdmin: true, // Creator 預設係 Admin
          });
        }
      } catch (error) {
        // 如果 trip member 插入失敗（例如 user 唔存在），只 log error
        // 唔會 throw，確保 trip 仍然成功 create
        console.error('[TripsService] Error creating trip member:', error);
      }
    }

    return trip;
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
  async findAll(include: string[] = []) {
    return this.db.query.trips.findMany({
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
}
