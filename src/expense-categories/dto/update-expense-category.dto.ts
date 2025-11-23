import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseCategoryDto } from './create-expense-category.dto';

/**
 * UpdateExpenseCategoryDto - 更新 Expense Category 嘅 DTO
 * 
 * 繼承 CreateExpenseCategoryDto，所有欄位都變成可選
 */
export class UpdateExpenseCategoryDto extends PartialType(CreateExpenseCategoryDto) {}
