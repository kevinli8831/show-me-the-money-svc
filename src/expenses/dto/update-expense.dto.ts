import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';

/**
 * UpdateExpenseDto - 更新 Expense 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 PATCH /expenses/:id 嘅 request body 結構
 * - 繼承 CreateExpenseDto 嘅所有 properties，但全部變做 optional
 * 
 * 例子：
 * PATCH /expenses/1
 * Body: { "title": "午餐" }  // 只更新 title
 */
export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
