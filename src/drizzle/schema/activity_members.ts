import { pgTable, bigint, boolean, timestamp, primaryKey, varchar, uuid } from 'drizzle-orm/pg-core';
import { activities } from './activities';
import { users } from './users';

/**
 * Activity Members Table Schema - 活動成員資料表
 * 
 * 用途：
 * - 儲存邊個 user 係邊個 activity 嘅 member
 * - Many-to-Many relationship between activities and users
 * - 記錄 member 係咪 Admin
 * 
 * 特點：
 * - Composite Primary Key (activityId + userId)
 * - 一個 activity 可以有多個 members
 * - 一個 user 可以係多個 activities 嘅 member
 * - Cascade delete: 刪除 activity 會自動刪除所有 activity members
 * 
 * 自動生成：
 * - ActivitiesService.create() 會自動將 creatorUserId 加入做 activity member (isAdmin: true)
 */
export const activityMembers = pgTable('activity_members', {
  /**
   * Activity ID（必填，Foreign Key）
   * 
   * references(() => activities.id, { onDelete: 'cascade' })
   * - Foreign Key 指向 activities.id
   * - onDelete: 'cascade' = 刪除 activity 會自動刪除所有相關嘅 activity members
   * 
   * notNull() = 必填
   */
  activityId: bigint('activity_id', { mode: 'number' }).notNull().references(() => activities.id, { onDelete: 'cascade' }),

  /**
   * User 名稱（必填）
   * 
   * 用途：
   * - Cache user name，避免每次都要 join users table
   * - 即使 user 改名，activity member 嘅名稱保持不變（snapshot）
   * 
   * 注意：
   * - 呢個係 denormalized data（冗餘資料）
   * - 好處：query 快啲，唔使 join
   * - 壞處：如果 user 改名，呢度唔會自動更新
   */
  userName: varchar('user_name', { length: 100 }).notNull(),

  /**
   * User ID（必填，Foreign Key）
   * 
   * references(() => users.id)
   * - Foreign Key 指向 users.id
   * - 冇 onDelete，所以如果 delete user，會 error（prevent accidental deletion）
   */
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id),

  /**
   * Member Token（唯一識別碼）
   * 
   * 用於 Guest-first 模式，後端靠此 Token 認人
   * 必須 Unique
   */
  memberToken: varchar('member_token', { length: 20 }).notNull().unique(),

  /**
   * 係咪虛擬成員
   * 
   * true = 主人幫你開嘅位，未有人認領
   */
  isVirtual: boolean('is_virtual').default(false).notNull(),

  /**
   * 係咪訪客
   * 
   * true = 真實設備加入，但未 Login Google
   */
  isGuest: boolean('is_guest').default(false).notNull(),

  /**
   * 係咪 Admin（預設 false）
   * 
   * 用途：
   * - Admin 可以管理 activity（例如加減 members, edit activity details）
   * - Creator 預設係 Admin
   * - 可以有多個 Admin
   */
  isAdmin: boolean('is_admin').default(false),

  /**
   * 加入時間（自動設定）
   * 
   * 記錄幾時加入呢個 activity
   */
  joinedAt: timestamp('joined_at').defaultNow(),
}, (t) => ({
  /**
   * Composite Primary Key
   * 
   * primaryKey({ columns: [t.activityId, t.userId] })
   * - Primary Key 係 (activityId, userId) 嘅組合
   * - 即係同一個 user 唔可以重複加入同一個 activity
   * - 但同一個 user 可以加入唔同嘅 activities
   * - 同一個 activity 可以有唔同嘅 users
   */
  pk: primaryKey({ columns: [t.activityId, t.memberToken] }),
}));

/**
 * Activity Members Relations - 定義 activity_members table 同其他 tables 嘅關係
 */
import { relations } from 'drizzle-orm';

export const activityMembersRelations = relations(activityMembers, ({ one }) => ({
  /**
   * 每個 activity member 屬於一個 activity
   */
  activity: one(activities, {
    fields: [activityMembers.activityId],
    references: [activities.id],
  }),

  /**
   * 每個 activity member 係一個 user
   */
  user: one(users, {
    fields: [activityMembers.userId],
    references: [users.id],
  }),
}));

