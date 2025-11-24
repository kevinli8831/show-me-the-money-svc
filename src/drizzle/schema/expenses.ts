import { pgTable, bigserial, bigint, varchar, decimal, char, date, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { trips } from './trips';
import { users } from './users';
import { expenseCategories } from './expense_categories';
import { relations } from 'drizzle-orm';
import { expensePayers } from './expense_payers';
import { expenseSplits } from './expense_splits';
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
   * 消費類別 ID（可選，Foreign Key）
   * 
   * 關聯到 expense_categories table
   */
  categoryId: integer('category_id').references(() => expenseCategories.id),

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


// 1. 正確嘅 expensesRelations（從 expenses 拉多對一）
export const expensesRelations = relations(expenses, ({ one, many }) => ({
  // one-to-one: category
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  // one-to-many: expensePayers（一個 expense 多 payers）
  expensePayers: many(expensePayers),
  // one-to-many: expenseSplits（一個 expense 多 splits）
  expenseSplits: many(expenseSplits),
}));
// 2. 反向關係（可選，從 payers 拉返 expense）
export const expensePayersRelations = relations(expensePayers, ({ one }) => ({
  expense: one(expenses, {
    fields: [expensePayers.expenseId],  // 假設你有 expenseId field
    references: [expenses.id],
  }),
}));

// 3. 同樣 splits 反向（可選）
export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
}));