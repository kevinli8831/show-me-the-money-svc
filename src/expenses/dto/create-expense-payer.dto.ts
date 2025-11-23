/**
 * CreateExpensePayerDto - 創建 Expense Payer 嘅 DTO
 * 
 * 用途：
 * - 定義邊個付錢同付咗幾多
 * - 作為 CreateExpenseDto 嘅 nested object
 */
export class CreateExpensePayerDto {
  /**
   * User ID（必填）
   * 
   * 記錄邊個 user 付錢
   */
  userId: number;
  /**
   * 付款金額（必填）
   * 
   * 用 string 避免 floating point precision 問題
   * 例如: "150.00"
   */
  amountPaid: string;
}