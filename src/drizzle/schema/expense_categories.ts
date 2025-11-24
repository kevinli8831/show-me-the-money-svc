import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

import { relations } from 'drizzle-orm';
import { expenses } from './expenses';
/**
 * Expense Categories Table Schema - 消費分類資料表
 * 
 * 用途：
 * - 儲存預設嘅 expense categories（例如：食飯、交通、住宿）
 * - 俾 frontend loop 出嚟做 select box
 * - 可以自訂 icon 同 color
 * 
 * 例子：
 * - { name: "食飯", icon: "🍔", color: "#FF5733", isActive: true }
 * - { name: "交通", icon: "🚗", color: "#3498DB", isActive: true }
 */
export const expenseCategories = pgTable('expense_categories', {
  /** Primary Key */
  id: serial('id').primaryKey(),

  /**
   * Category 名稱（必填，唯一）
   * 
   * 例如：食飯、交通、住宿、娛樂、購物、其他
   */
  name: varchar('name', { length: 100 }).notNull().unique(),

  /**
   * Icon 名稱（可選）
   * 
   * 可以用 emoji 或者 icon library 嘅名稱
   * 例如：🍔、🚗、🏨、material-icons:restaurant
   */
  icon: varchar('icon', { length: 50 }),

  /**
   * 顏色代碼（可選）
   * 
   * Hex color code
   * 例如：#FF5733、#3498DB
   */
  color: varchar('color', { length: 7 }),

  /**
   * 係咪 Active（預設 true）
   * 
   * false = soft delete，唔會喺 frontend 顯示
   */
  isActive: boolean('is_active').default(true).notNull(),

  /** 創建時間（自動設定） */
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));
