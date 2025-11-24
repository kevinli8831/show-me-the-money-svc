import { CreateExpensePayerDto } from "./create-expense-payer.dto";
import { CreateExpenseSplitDto } from "./create-expense-split.dto";

/**
 * CreateExpenseDto - 創建 Expense 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 POST /expenses 嘅 request body 結構
 * - 記錄 trip 入面嘅消費
 * - 同時 create expense payers 同 splits
 */
export class CreateExpenseDto {
  /**
   * Trip ID（必填）
   * 
   * 指定呢個 expense 屬於邊個 trip
   */
  tripId: number;

  /**
   * 消費標題（必填）
   * 
   * 例如: "晚餐", "酒店", "交通"
   */
  title: string;

  /**
   * 金額（必填）
   * 
   * 用 string 而唔係 number 係因為：
   * - 避免 floating point precision 問題
   * - Database 用 decimal type，Drizzle 會 return string
   * 
   * 例如: "300.50"
   */
  amount: string;

  /**
   * 貨幣代碼（可選）
   * 
   * 例如: "HKD", "USD", "CNY"
   */
  currency?: string;

  /**
   * 消費類別 ID（可選）
   * 
   * 對應 expense_categories table 嘅 ID
   */
  categoryId?: number;

  /**
   * 備註（可選）
   * 
   * 例如: "海底撈", "包括小費"
   */
  note?: string;

  /**
   * 收據圖片 URL（可選）
   * 
   * 例如: "https://example.com/receipt.jpg"
   */
  receiptImageUrl?: string;

  /**
   * 創建者 User ID（必填）
   * 
   * 記錄邊個 user create 呢個 expense
   */
  createdBy: number;

  /**
   * Expense Payers（可選）
   * 
   * 記錄邊個付錢同付咗幾多
   * 如果唔提供，預設係 createdBy 付晒所有錢
   * 
   * 例子：
   * [
   *   { userId: 1, amountPaid: "200.00" },
   *   { userId: 2, amountPaid: "100.00" }
   * ]
   */
  payers?: CreateExpensePayerDto[];

  /**
   * Expense Splits（可選）
   * 
   * 記錄點樣分帳
   * 如果唔提供，預設係所有 trip members 平分
   * 
   * 例子：
   * [
   *   { userId: 1, shareAmount: "150.00", splitMethod: "custom" },
   *   { userId: 2, shareAmount: "150.00", splitMethod: "custom" }
   * ]
   */
  splits?: CreateExpenseSplitDto[];
}
