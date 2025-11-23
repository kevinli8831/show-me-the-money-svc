/**
 * CreateExpenseSplitDto - 創建 Expense Split 嘅 DTO
 * 
 * 用途：
 * - 定義點樣分帳
 * - 作為 CreateExpenseDto 嘅 nested object
 */
export class CreateExpenseSplitDto {
  /**
   * User ID（必填）
   * 
   * 記錄邊個 user 應該俾錢
   */
  userId: number;
  /**
   * 分帳金額（可選）
   * 
   * 如果用 custom split，就填呢個 field
   * 例如: "100.00"
   */
  shareAmount?: string;
  /**
   * 百分比（可選）
   * 
   * 如果用 percentage split，就填呢個 field
   * 例如: "0.3333" = 33.33%
   */
  percentage?: string;
  /**
   * 分帳方式（可選，預設 'equal'）
   * 
   * 可能嘅值：
   * - 'equal': 平分
   * - 'percentage': 百分比
   * - 'custom': 自訂金額
   */
  splitMethod?: 'equal' | 'percentage' | 'custom';
  /**
   * 備註（可選）
   * 
   * 例如: "佢食得多啲"
   */
  note?: string;
}
