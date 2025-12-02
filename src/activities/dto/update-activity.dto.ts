import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';

/**
 * UpdateActivityDto - 更新 Activity 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 PATCH /activities/:id 嘅 request body 結構
 * - 繼承 CreateActivityDto 嘅所有 properties，但全部變做 optional
 * 
 * PartialType 來自 @nestjs/swagger（唔係 @nestjs/mapped-types）
 * 原因：
 * - @nestjs/swagger 嘅 PartialType 會保留 Swagger metadata
 * - 確保 Swagger UI 正確顯示 date picker 等 UI 元素
 * 
 * 例子：
 * PATCH /activities/1
 * Body: { "name": "新名稱" }  // 只更新 name，其他 fields 唔變
 */
export class UpdateActivityDto extends PartialType(CreateActivityDto) { }
