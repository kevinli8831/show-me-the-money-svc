import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsInt, IsIn } from 'class-validator';

/**
 * CreateUserDto - 創建 User 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義創建 user 時需要嘅 fields
 * - 自動驗證 input data
 * 
 * 支援兩種模式：
 * 1. 真實用戶 (userType = 'email'/'google'/'apple'): 需要 email
 * 2. 虛擬成員 (userType = 'virtual'): 只需要 name
 */
export class CreateUserDto {
  /**
   * User 名稱（必填）
   * 
   * @IsString() = 驗證係咪 string type
   */
  @IsString()
  name: string;

  /**
   * Email 地址（可選）
   * 
   * @IsEmail() = 驗證係咪有效嘅 email format
   * @IsOptional() = 呢個 field 可以唔填
   * 
   * Virtual User 可以無 email
   */
  @IsEmail()
  @IsOptional()
  email?: string;

  /**
   * 電話號碼（可選）
   * 
   * @IsPhoneNumber() = 驗證係咪有效嘅電話號碼
   * @IsOptional() = 可以唔填
   */
  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  /**
   * 用戶類型（可選，預設 'email'）
   * 
   * 支援以下類型：
   * - 'virtual': 虛擬成員（只有名字，未註冊）
   * - 'email': Email/Password 註冊用戶
   * - 'google': Google OAuth 用戶
   * - 'apple': Apple Sign In 用戶
   */
  @IsIn(['virtual', 'email', 'google', 'apple'])
  @IsOptional()
  userType?: 'virtual' | 'email' | 'google' | 'apple';

  /**
   * 邊個用戶創建呢個虛擬成員（可選）
   * 
   * 只適用於 userType = 'virtual'
   */
  @IsInt()
  @IsOptional()
  createdBy?: number;

  /**
   * Avatar URL（可選）
   * 例如: "https://example.com/avatar.jpg"
   */
  avatarUrl?: string;
}
