import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { OptionalJwtGuard } from '../auth/guards/auth.guard';

/**
 * ExpensesController - 處理所有 /expenses 開頭嘅 HTTP requests
 * 
 * API Endpoints:
 * - POST   /expenses      創建新 expense
 * - GET    /expenses      獲取所有 expenses
 * - GET    /expenses/:id  獲取單個 expense
 * - PATCH  /expenses/:id  更新 expense
 * - DELETE /expenses/:id  刪除 expense
 */
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  /**
   * 創建新 Expense
   * 
   * HTTP: POST /expenses
   * Request Body 例子:
   * {
   *   "tripId": 1,
   *   "title": "晚餐",
   *   "amount": "300.50",
   *   "currency": "HKD",
   *   "category": "食飯",
   *   "note": "海底撈",
   *   "createdBy": 1
   * }
   */
  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  /**
   * 獲取所有 Expenses
   * 
   * HTTP: GET /expenses
   */
  @Get()
  findAll() {
    return this.expensesService.findAll();
  }

  /**
   * 獲取單個 Expense
   * 
   * HTTP: GET /expenses/1
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(+id);
  }

  /**
   * 更新 Expense
   * 
   * HTTP: PATCH /expenses/1
   * Request Body 例子:
   * {
   *   "title": "午餐"
   * }
   */
  @Patch(':id')
  @UseGuards(OptionalJwtGuard)
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    return this.expensesService.update(+id, memberToken, updateExpenseDto, req.user?.userId);
  }

  /**
   * 刪除 Expense
   * 
   * HTTP: DELETE /expenses/1
   */
  @Delete(':id')
  @UseGuards(OptionalJwtGuard)
  remove(
    @Param('id') id: string,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    return this.expensesService.remove(+id, memberToken, req.user?.userId);
  }
}
