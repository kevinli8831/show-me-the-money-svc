import { pgTable, bigserial, bigint, varchar, decimal, char, date, text, timestamp } from 'drizzle-orm/pg-core';
import { trips } from './trips';
import { users } from './users';

/**
 * Expenses Table Schema - 消費記錄資料表
 * 
 * 用途：
 * - 儲存 trip 入面嘅所有消費記錄
 * - 記錄邊個付錢（expense_payers）
 * - 記錄點樣分帳（expense_splits）
 * 
 * 關聯：
 * - expense_payers.expenseId -> expenses.id (一個 expense 可以有多個 payers)
 * - expense_splits.expenseId -> expenses.id (一個 expense 可以有多個 splits)
 */
export const expenses = pgTable('expenses', {
  /** Primary Key */
  id: bigserial('id', { mode: 'number' }).primaryKey(),

  /**
   * Trip ID（必填，Foreign Key）
   * 
   * onDelete: 'cascade' = 刪除 trip 會自動刪除所有 expenses
   */
  tripId: bigint('trip_id', { mode: 'number' }).notNull().references(() => trips.id, { onDelete: 'cascade' }),

  /**
   * 消費標題（必填）
   * 
   * 例如: "晚餐", "酒店", "交通"
   */
  title: varchar('title', { length: 200 }).notNull(),

  /**
   * 金額（必填）
   * 
   * decimal(12, 2) = 最多 12 位數字，2 位小數
   * 例如: 1234567890.12
   * 
   * 用 decimal 而唔係 float 係因為 decimal 精確度高，適合金錢計算
   */
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

  /**
   * 貨幣代碼（可選）
   * 
   * char(3) = 固定 3 個字符
   * 例如: "HKD", "USD", "CNY"
   * 遵循 ISO 4217 標準
   */
  currency: char('currency', { length: 3 }),

  /**
   * 消費類別（可選）
   * 
   * 例如: "食飯", "住宿", "交通", "娛樂"
   */
  category: varchar('category', { length: 50 }),

  /**
   * 備註（可選）
   * 
   * text = 無長度限制
   * 用於記錄額外資訊
   */
  note: text('note'),

  /**
   * 收據圖片 URL（可選）
   * 
   * 用於儲存收據相片嘅 URL
   */
  receiptImageUrl: text('receipt_image_url'),

  /**
   * 創建者 User ID（必填，Foreign Key）
   * 
   * 記錄邊個 create 呢個 expense
   */
  createdBy: bigint('created_by', { mode: 'number' }).notNull().references(() => users.id),

  /** 創建時間（自動設定） */
  createdAt: timestamp('created_at').defaultNow(),
});
