import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * CreateTripDto - 創建 Trip 嘅 Data Transfer Object
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
export class CreateTripDto {
  /**
   * Trip 名稱
   * 例如: "重廈旅行"
   */
  name: string;

  /**
   * Trip 描述（可選）
   * 例如: "去重慶同廈門玩"
   */
  description?: string;

  /**
   * 創建者 User ID（可選）
   * 
   * 如果有提供，他已經登入了
   * @Type(() => Number) 確保 JSON number 轉做 TypeScript number
   */
  @Type(() => Number)
  userId?: number;

  /**
   * 開始日期（可選）
   * 
   * JSON 入面傳 string: "2025-10-23"
   * @Type(() => Date) 會自動轉做 Date object
   * @ApiProperty({ format: 'date' }) 會係 Swagger 顯示做 date picker
   */
  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  startDate?: Date;

  /**
   * 結束日期（可選）
   * 
   * 同 startDate 一樣，會自動轉做 Date object
   */
  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  endDate?: Date;

}
