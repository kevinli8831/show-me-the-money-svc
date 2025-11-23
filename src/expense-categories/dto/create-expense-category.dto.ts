import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';

/**
 * CreateExpenseCategoryDto - 建立 Expense Category 嘅 DTO
 */
export class CreateExpenseCategoryDto {
  /**
   * Category 名稱（必填）
   * 
   * 例如：食飯、交通、住宿
   */
  @IsString()
  @MaxLength(100)
  name: string;

  /**
   * Icon（可選）
   * 
   * 可以用 emoji 或者 icon library 嘅名稱
   * 例如：🍔、🚗、material-icons:restaurant
   */
  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  /**
   * 顏色代碼（可選）
   * 
   * Hex color code，例如：#FF5733
   */
  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  /**
   * 係咪 Active（可選，預設 true）
   */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
