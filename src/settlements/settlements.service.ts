import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';

/**
 * PaymentsService - 處理所有 Payment 相關嘅業務邏輯
 * 
 * 主要功能：
 * - CRUD operations for payments
 * - 管理 activity 入面嘅還款記錄
 * 
 * 用途：
 * - 記錄邊個還錢俾邊個
 * - 用於結算 activity 嘅欠款
 * 
 * 注意：
 * - 每個 payment 必須屬於一個 activity
 * - fromUserId 係還錢嘅人（欠錢嘅人）
 * - toUserId 係收錢嘅人（多俾咗錢嘅人）
 */
@Injectable()
export class SettlementsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) { }

  /**
   * Create Settlement
   */
  async create(createSettlementDto: CreateSettlementDto) {
    const [settlement] = await this.db
      .insert(schema.settlements)
      .values(createSettlementDto)
      .returning();
    return settlement;
  }

  /**
   * Find All
   */
  async findAll() {
    return this.db.query.settlements.findMany();
  }

  /**
   * Find One
   */
  async findOne(id: number) {
    const settlement = await this.db.query.settlements.findFirst({
      where: eq(schema.settlements.id, id),
    });

    if (!settlement) {
      throw new NotFoundException(`Settlement with ID ${id} not found`);
    }

    return settlement;
  }

  /**
   * Update Settlement
   */
  async update(id: number, updateSettlementDto: UpdateSettlementDto) {
    const [settlement] = await this.db
      .update(schema.settlements)
      .set(updateSettlementDto)
      .where(eq(schema.settlements.id, id))
      .returning();

    if (!settlement) {
      throw new NotFoundException(`Settlement with ID ${id} not found`);
    }

    return settlement;
  }

  /**
   * Remove Settlement
   */
  async remove(id: number) {
    const [settlement] = await this.db
      .delete(schema.settlements)
      .where(eq(schema.settlements.id, id))
      .returning();

    if (!settlement) {
      throw new NotFoundException(`Settlement with ID ${id} not found`);
    }

    return settlement;
  }
}
