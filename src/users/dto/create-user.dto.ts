/**
 * CreateUserDto - 創建 User 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 POST /users 嘅 request body 結構
 * - 驗證 input data
 * 
 * 所有 fields 都係 optional 除咗 name
 */
export class CreateUserDto {
  /**
   * User 名稱（必填）
   * 例如: "Kevin"
   */
  name: string;

  /**
   * Email 地址（可選）
   * 例如: "kevin@example.com"
   */
  email?: string;

  /**
   * 電話號碼（可選）
   * 例如: "12345678"
   * 
   * 注意：schema 入面 phone 係 unique，所以唔可以重複
   */
  phone?: string;

  /**
   * Avatar URL（可選）
   * 例如: "https://example.com/avatar.jpg"
   */
  avatarUrl?: string;
}
