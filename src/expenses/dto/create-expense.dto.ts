

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
   * 金額（必填）
   */
  amount: string;

  /**
   * 貨幣代碼（可選）
   */
  currency?: string;

  /**
   * 參與者 Token 列表 (Member Tokens)
   */
  participantTokens: string[];

  /**
   * 實際付款金額列表 (Paid Amounts)
   */
  paidAmounts: string[];

  /**
   * 應付金額列表 (Share Amounts)
   */
  shareAmounts: string[];

  /**
   * 創建者 Token (Member Token)
   */
  createdByToken: string;
}
