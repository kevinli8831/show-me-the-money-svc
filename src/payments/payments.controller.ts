import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

/**
 * PaymentsController - 處理所有 /payments 開頭嘅 HTTP requests
 * 
 * API Endpoints:
 * - POST   /payments      創建新 payment
 * - GET    /payments      獲取所有 payments
 * - GET    /payments/:id  獲取單個 payment
 * - PATCH  /payments/:id  更新 payment
 * - DELETE /payments/:id  刪除 payment
 */
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  /**
   * 創建新 Payment
   * 
   * HTTP: POST /payments
   * Request Body 例子:
   * {
   *   "activityId": 1,
   *   "fromUserId": 2,  // Yanki 還錢
   *   "toUserId": 1,    // 俾 Kevin
   *   "amount": "50.00",
   *   "currency": "HKD",
   *   "note": "轉數快"
   * }
   */
  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  /**
   * 獲取所有 Payments
   * 
   * HTTP: GET /payments
   */
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  /**
   * 獲取單個 Payment
   * 
   * HTTP: GET /payments/1
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(+id);
  }

  /**
   * 更新 Payment
   * 
   * HTTP: PATCH /payments/1
   * Request Body 例子:
   * {
   *   "amount": "60.00"
   * }
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  /**
   * 刪除 Payment
   * 
   * HTTP: DELETE /payments/1
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(+id);
  }
}
