import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsBoolean, IsInt } from 'class-validator';

/**
 * CreateUserDto - 創建 User 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義創建 user 時需要嘅 fields
 * - 自動驗證 input data
 * 
 * 支援兩種模式：
 * 1. 真實用戶 (isVirtual = false): 需要 email
 * 2. 虛擬成員 (isVirtual = true): 只需要 name
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
   * 係咪虛擬成員（可選，預設 false）
   * 
   * true = 虛擬成員（只有名字，未註冊）
   * false = 真實用戶（有 email/OAuth）
   */
  @IsBoolean()
  @IsOptional()
  isVirtual?: boolean;

  /**
   * 邊個用戶創建呢個虛擬成員（可選）
   * 
   * 只適用於 isVirtual = true
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
