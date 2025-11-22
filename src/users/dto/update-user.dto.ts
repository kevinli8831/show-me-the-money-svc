import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * UpdateUserDto - 更新 User 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 PATCH /users/:id 嘅 request body 結構
 * - 繼承 CreateUserDto 嘅所有 properties，但全部變做 optional
 * 
 * PartialType 來自 @nestjs/mapped-types
 * 作用：將所有 fields 變做 optional，方便 partial update
 * 
 * 例子：
 * PATCH /users/1
 * Body: { "name": "New Name" }  // 只更新 name
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
