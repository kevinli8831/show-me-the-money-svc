import { PartialType } from '@nestjs/swagger';
import { CreateTripDto } from './create-trip.dto';

/**
 * UpdateTripDto - 更新 Trip 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 PATCH /trips/:id 嘅 request body 結構
 * - 繼承 CreateTripDto 嘅所有 properties，但全部變做 optional
 * 
 * PartialType 來自 @nestjs/swagger（唔係 @nestjs/mapped-types）
 * 原因：
 * - @nestjs/swagger 嘅 PartialType 會保留 Swagger metadata
 * - 確保 Swagger UI 正確顯示 date picker 等 UI 元素
 * 
 * 例子：
 * PATCH /trips/1
 * Body: { "name": "新名稱" }  // 只更新 name，其他 fields 唔變
 */
export class UpdateTripDto extends PartialType(CreateTripDto) {}
