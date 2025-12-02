import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

/**
 * CreateActivityDto - 創建 Activity 嘅 Data Transfer Object
 * 
 * 用途：
 * 1. 定義 API request body 嘅結構
 * 2. 自動將 JSON 轉做對應嘅 TypeScript type
 * 3. 係 Swagger UI 顯示正確嘅 input type
 * 
 * 重要 Decorators:
 * - @Type(() => Date): 將 JSON string "2025-10-23" 轉做 Date object
 * - @Type(() => Number): 將 JSON number 轉做 TypeScript number
 * - @ApiProperty: 設定 Swagger UI 顯示方式
 */
export class CreateActivityMembersDto {
  /**
   * Activity 名稱
   * 例如: "重廈旅行"
   */
  @ApiProperty({ type: String, required: true })
  @IsString()
  userName: string;

  /**
   * Activity 描述（可選）
   * 例如: "去重慶同廈門玩"
   */
  @ApiProperty({ type: Number, required: false })
  @IsOptional()
  @Type(() => Number)
  userId?: number;

  /**
   * 創建者 User ID（可選）
   * 
   * 如果有提供，他已經登入了
   * @Type(() => Number) 確保 JSON number 轉做 TypeScript number
   */
  @ApiProperty({ type: Boolean, required: true })
  @IsBoolean()
  isAdmin: boolean;

}
