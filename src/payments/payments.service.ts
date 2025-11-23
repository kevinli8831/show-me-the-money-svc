import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * PaymentsService - 處理所有 Payment 相關嘅業務邏輯
 * 
 * 主要功能：
 * - CRUD operations for payments
 * - 管理 trip 入面嘅還款記錄
 * 
 * 用途：
 * - 記錄邊個還錢俾邊個
 * - 用於結算 trip 嘅欠款
 * 
 * 注意：
 * - 每個 payment 必須屬於一個 trip
 * - fromUserId 係還錢嘅人（欠錢嘅人）
 * - toUserId 係收錢嘅人（多俾咗錢嘅人）
 */
@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  /**
   * 創建新 Payment
   * 
   * 例子：
   * createPaymentDto = {
   *   tripId: 1,
   *   fromUserId: 2,  // Yanki 還錢
   *   toUserId: 1,    // 俾 Kevin
   *   amount: "50.00",
   *   currency: "HKD",
   *   note: "轉數快"
   * }
   */
  async create(createPaymentDto: CreatePaymentDto) {
    const [payment] = await this.db
      .insert(schema.payments)
      .values(createPaymentDto)
      .returning();
    return payment;
  }

  /**
   * 獲取所有 Payments
   */
  async findAll() {
    return this.db.query.payments.findMany();
  }

  /**
   * 根據 ID 獲取單個 Payment
   */
  async findOne(id: number) {
    const payment = await this.db.query.payments.findFirst({
      where: eq(schema.payments.id, id),
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * 更新 Payment
   */
  async update(id: number, updatePaymentDto: UpdatePaymentDto) {
    const [payment] = await this.db
      .update(schema.payments)
      .set(updatePaymentDto)
      .where(eq(schema.payments.id, id))
      .returning();

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * 刪除 Payment
   */
  async remove(id: number) {
    const [payment] = await this.db
      .delete(schema.payments)
      .where(eq(schema.payments.id, id))
      .returning();

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }
}
