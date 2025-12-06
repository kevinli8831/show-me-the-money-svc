/**
 * CreatePaymentDto - 創建 Payment 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 POST /payments 嘅 request body 結構
 * - 記錄還款資訊
 */
export class CreateSettlementDto {
  /**
   * Activity ID（必填）
   * 
   * 指定呢個 settlement 屬於邊個 activity
   */
  activityId: number;

  /**
   * 付款人 User ID（必填）
   * 
   * 記錄邊個 user 還錢（欠錢嘅人）
   */
  payerToken: string;

  /**
   * 收款人 User ID（必填）
   * 
   * 記錄邊個 user 收錢（多俾咗錢嘅人）
   */
  receiverToken: string;

  /**
   * 還款金額（必填）
   * 
   * 用 string 而唔係 number 係因為：
   * - 避免 floating point precision 問題
   * - Database 用 decimal type，Drizzle 會 return string
   * 
   * 例如: "50.00"
   */
  amount: string;

  /**
   * 備註（可選）
   * 
   * 例如: "轉數快", "現金", "PayMe"
   */
  description?: string;
}
