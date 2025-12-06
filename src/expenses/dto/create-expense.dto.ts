

/**
 * CreateExpenseDto - 創建 Expense 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 POST /expenses 嘅 request body 結構
 * - 記錄 activity 入面嘅消費
 * - 同時 create expense payers 同 splits
 */
export class CreateExpenseDto {
  /**
   * Activity ID（必填）
   */
  activityId: number;

  /**
   * 消費描述（必填）
   */
  description: string;

  /**
   * 總金額（必填）
   */
  totalAmount: string;

  /**
   * 貨幣代碼（可選）
   */
  currency?: string;

  /**
   * 參與者列表
   */
  participants: {
    memberToken: string;
    paidAmount: string;
    owedAmount: string;
  }[];

  /**
   * 創建者 Token (Member Token)
   */
  createdByToken: string;
}
