import { pgTable, bigserial, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('user_type_enum', ['virtual', 'email', 'google', 'apple']);

/**
 * Users Table Schema - 用戶資料表
 * 
 * 用途：
 * - 儲存所有 user 嘅基本資料
 * - 用於 authentication 同 user profile
 * - 支援 Virtual Members (虛擬成員)
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
   * 
   * Virtual User 可以無 email
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
   * Auth Provider (google / apple / email)
   * 
   * Virtual User 無 provider
   */
  provider: varchar('provider', { length: 50 }),

  /**
   * Provider User ID (e.g. Google sub, Apple sub)
   * 
   * Virtual User 無 providerId
   */
  providerId: varchar('provider_id', { length: 255 }),

  /**
   * Refresh Token (Hashed)
   * 用於長效登入
   */
  refreshToken: text('refresh_token'),

  /**
   * 用戶類型（必填）
   * 
   * 支援以下類型：
   * - 'virtual': 虛擬成員（只有名字，未註冊）
   * - 'email': Email/Password 註冊用戶
   * - 'google': Google OAuth 用戶
   * - 'apple': Apple Sign In 用戶
   * 
   * 預設值：'email'
   */
  userType: userTypeEnum('user_type').notNull().default('email'),

  /**
   * Avatar URL（可選）
   * 
   * text = 無長度限制嘅 text field
   * 用於儲存 avatar image 嘅 URL
   */
  avatarUrl: text('avatar_url'),

  /**
   * 被邊個真實用戶認領（可選）
   * 
   * 當虛擬成員被真實用戶 claim 之後，呢個 field 會指向真實用戶嘅 ID
   * 用於 audit trail
   * 只適用於 userType = 'virtual' 嘅 user
   */
  claimedBy: integer('claimed_by').references(() => users.id),

  /**
   * 邊個用戶創建呢個虛擬成員（可選）
   * 
   * 記錄邊個用戶創建咗呢個虛擬成員
   * 只適用於 userType = 'virtual' 嘅 user
   */
  createdBy: integer('created_by').references(() => users.id),

  /**
   * 創建時間（自動設定）
   * 
   * timestamp = PostgreSQL TIMESTAMP type
   * defaultNow() = insert 嗰陣自動 set 做而家嘅時間
   */
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Users Relations - 定義 users table 同其他 tables 嘅關係
 */
import { relations } from 'drizzle-orm';
import { tripMembers } from './trip_members';

export const usersRelations = relations(users, ({ many }) => ({
  /**
   * 一個 user 可以係多個 trips 嘅 member
   */
  tripMembers: many(tripMembers),
}));

