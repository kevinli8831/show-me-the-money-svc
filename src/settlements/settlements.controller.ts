import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { formatSuccessResponse } from '../common/helpers';

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
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) { }

  /**
   * Create Settlement
   * HTTP: POST /settlements
   */
  @Post()
  async create(@Body() createSettlementDto: CreateSettlementDto) {
    const settlement = await this.settlementsService.create(createSettlementDto);
    return formatSuccessResponse(settlement, '成功創建 Settlement');
  }

  /**
   * Find All Settlements
   * HTTP: GET /settlements
   */
  @Get()
  async findAll() {
    const settlements = await this.settlementsService.findAll();
    return formatSuccessResponse(settlements, '成功獲取 Settlements');
  }

  /**
   * Find One Settlement
   * HTTP: GET /settlements/1
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const settlement = await this.settlementsService.findOne(+id);
    return formatSuccessResponse(settlement, '成功獲取 Settlement');
  }

  /**
   * Update Settlement
   * HTTP: PATCH /settlements/1
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSettlementDto: UpdateSettlementDto) {
    const settlement = await this.settlementsService.update(+id, updateSettlementDto);
    return formatSuccessResponse(settlement, '成功更新 Settlement');
  }

  /**
   * Remove Settlement
   * HTTP: DELETE /settlements/1
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.settlementsService.remove(+id);
    return formatSuccessResponse(result, '成功刪除 Settlement');
  }
}
