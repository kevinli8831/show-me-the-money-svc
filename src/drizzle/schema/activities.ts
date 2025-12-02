import { pgTable, bigserial, varchar, text, date, timestamp, bigint, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Activities Table Schema - 活動資料表
 * 
 * 用途：
 * - 儲存所有 activity 嘅基本資料
 * - 一個 activity 可以有多個 members, expenses, payments
 * 
 * 關聯：
 * - activity_members.activityId -> activities.id (一個 activity 有多個 members)
 * - expenses.activityId -> activities.id (一個 activity 有多個 expenses)
 * - payments.activityId -> activities.id (一個 activity 有多個 payments)
 */
export const activities = pgTable('activities', {
  /**
   * Primary Key - 自動遞增嘅 ID
   */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Activity 名稱（必填）
   * 
   * 例如: "重廈旅行", "日本之旅"
   */
  name: varchar('name', { length: 100 }).notNull(),

  /**
   * Activity Share Code（必填，唯一）
   * 
   * 例如: "ABCD1234"
   */
  shareCode: varchar('share_code', { length: 8 }).notNull().unique(),

  /**
   * Activity 描述（可選）
   * 
   * text = 無長度限制
   * 用於儲存詳細嘅 activity 描述
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
   * - 如果有 creatorUserId，ActivitiesService.create 會自動將佢加入做 activity member (Admin)
   * - 冇 onDelete，所以如果 delete user，呢個 field 會變 NULL
   */
  creatorMemberToken: varchar('creator_member_token', { length: 20 }).notNull().unique(),

  creatorUserId: bigint('creator_user_id', { mode: 'number' }).references(() => users.id, { onDelete: 'set null' }),  // 創建者
  /**
   * 創建時間（自動設定）
   */
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Activities Relations - 定義 activities table 同其他 tables 嘅關係
 * 
 * 呢啲 relations 係比 Drizzle Query API 用嘅（例如 db.query.activities.findMany({ with: { ... } })）
 * 唔係 database constraints，只係 TypeScript type 同 query builder 用
 */
import { relations } from 'drizzle-orm';
import { activityMembers } from './activity_members';
import { expenses } from './expenses';

export const activitiesRelations = relations(activities, ({ many, one }) => ({
  /**
   * 一個 activity 有多個 activity members
   * 
   * 用法：
   * db.query.activities.findMany({ with: { activityMembers: true } })
   */
  creator: one(users, {  // 從 activity 拉創建者
    fields: [activities.creatorUserId],
    references: [users.id],
  }),
  activityMembers: many(activityMembers),
  expenses: many(expenses),
}));

