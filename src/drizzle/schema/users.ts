import { pgTable, bigserial, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Users Table Schema - 用戶資料表
 * 
 * 用途：
 * - 儲存所有 user 嘅基本資料
 * - 用於 authentication 同 user profile
 * 
 * 關聯：
 * - trips.creatorUserId -> users.id (一個 user 可以 create 多個 trips)
 * - trip_members.userId -> users.id (一個 user 可以係多個 trips 嘅 member)
 * - expenses.createdBy -> users.id (一個 user 可以 create 多個 expenses)
 * - expense_payers.userId -> users.id
 * - expense_splits.userId -> users.id
 * - payments.fromUserId/toUserId -> users.id
 */
export const users = pgTable('users', {
  /**
   * Primary Key - 自動遞增嘅 ID
   * 
   * bigserial = PostgreSQL BIGSERIAL type (auto-increment big integer)
   * mode: 'number' = TypeScript type 係 number 而唔係 string
   */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * User 名稱（必填）
   * 
   * varchar(100) = 最多 100 個字符
   * notNull() = 唔可以係 NULL
   */
  name: varchar('name', { length: 100 }).notNull(),

  /**
   * Email 地址（可選，唯一）
   * 
   * varchar(255) = 最多 255 個字符
   * unique() = 唔可以重複，database 會 create unique index
   */
  email: varchar('email', { length: 255 }).unique(),

  /**
   * 電話號碼（可選，唯一）
   * 
   * varchar(20) = 最多 20 個字符
   * unique() = 唔可以重複
   */
  phone: varchar('phone', { length: 20 }).unique(),

  /**
   * Avatar URL（可選）
   * 
   * text = 無長度限制嘅 text field
   * 用於儲存 avatar image 嘅 URL
   */
  avatarUrl: text('avatar_url'),

  /**
   * 係咪已註冊用戶（預設 false）
   * 
   * boolean = true/false
   * default(false) = 新 user 預設係未註冊
   * 
   * 用途：區分已註冊用戶同臨時用戶（例如被邀請加入 trip 但未註冊）
   */
  isRegistered: boolean('is_registered').default(false),

  /**
   * 創建時間（自動設定）
   * 
   * timestamp = PostgreSQL TIMESTAMP type
   * defaultNow() = insert 嗰陣自動 set 做而家嘅時間
   */
  createdAt: timestamp('created_at').defaultNow(),
});
