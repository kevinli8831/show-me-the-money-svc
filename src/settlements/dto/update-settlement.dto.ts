import { PartialType } from '@nestjs/mapped-types';
import { CreateSettlementDto } from './create-settlement.dto';

/**
 * UpdatePaymentDto - 更新 Payment 嘅 Data Transfer Object
 * 
 * 用途：
 * - 定義 PATCH /payments/:id 嘅 request body 結構
 * - 繼承 CreatePaymentDto 嘅所有 properties，但全部變做 optional
 * 
 * 例子：
 * PATCH /payments/1
 * Body: { "amount": "60.00" }  // 只更新 amount
 */
export class UpdateSettlementDto extends PartialType(CreateSettlementDto) { }
