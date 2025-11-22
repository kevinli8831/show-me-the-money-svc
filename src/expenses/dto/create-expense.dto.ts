/**
 * CreateExpenseDto - 創建 Expense 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 POST /expenses 嘅 request body 結構
 * - 記錄 trip 入面嘅消費
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
   * 消費類別（可選）
   * 
   * 例如: "食飯", "住宿", "交通"
   */
  category?: string;

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
}
