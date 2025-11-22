import { pgTable, bigserial, varchar, text, date, timestamp, bigint } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Trips Table Schema - 旅行資料表
 * 
 * 用途：
 * - 儲存所有 trip 嘅基本資料
 * - 一個 trip 可以有多個 members, expenses, payments
 * 
 * 關聯：
 * - trip_members.tripId -> trips.id (一個 trip 有多個 members)
 * - expenses.tripId -> trips.id (一個 trip 有多個 expenses)
 * - payments.tripId -> trips.id (一個 trip 有多個 payments)
 */
export const trips = pgTable('trips', {
  /**
   * Primary Key - 自動遞增嘅 ID
   */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Trip 名稱（必填）
   * 
   * 例如: "重廈旅行", "日本之旅"
   */
  name: varchar('name', { length: 100 }).notNull(),

  /**
   * Trip 描述（可選）
   * 
   * text = 無長度限制
   * 用於儲存詳細嘅 trip 描述
   */
  description: text('description'),

  /**
   * 開始日期（可選）
   * 
   * date = PostgreSQL DATE type (YYYY-MM-DD)
   * 注意：Drizzle 會將 date 轉做 string，所以 DTO 入面要處理 Date -> string 轉換
   */
  startDate: date('start_date'),

  /**
   * 結束日期（可選）
   * 
   * date = PostgreSQL DATE type (YYYY-MM-DD)
   */
  endDate: date('end_date'),

  /**
   * 創建者 User ID（可選）
   * 
   * bigint = PostgreSQL BIGINT type
   * mode: 'number' = TypeScript type 係 number
   * references(() => users.id) = Foreign Key 指向 users.id
   * 
   * 注意：
   * - 如果有 creatorUserId，TripsService.create 會自動將佢加入做 trip member (Admin)
   * - 冇 onDelete，所以如果 delete user，呢個 field 會變 NULL
   */
  creatorUserId: bigint('creator_user_id', { mode: 'number' }).references(() => users.id),

  /**
   * 創建時間（自動設定）
   */
  createdAt: timestamp('created_at').defaultNow(),
});
