import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Req, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { OptionalJwtGuard } from '../auth/guards/auth.guard';
import { formatSuccessResponse } from '../common/helpers';

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
   *   "activityId": 1,
   *   "title": "晚餐",
   *   "amount": "300.50",
   *   "currency": "HKD",
   *   "category": "食飯",
   *   "note": "海底撈",
   *   "createdBy": 1
   * }
   */
  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto) {
    const expense = await this.expensesService.create(createExpenseDto);
    return formatSuccessResponse(expense, '成功創建 Expense');
  }

  /**
   * 獲取所有 Expenses
   * 
   * HTTP: GET /expenses
   */
  @Get()
  async findAll() {
    const expenses = await this.expensesService.findAll();
    return formatSuccessResponse(expenses, '成功獲取 Expenses');
  }

  /**
   * 獲取單個 Expense
   * 
   * HTTP: GET /expenses/1
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const expense = await this.expensesService.findOne(+id);
    return formatSuccessResponse(expense, '成功獲取 Expense');
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
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    const expense = await this.expensesService.update(+id, memberToken, updateExpenseDto, req.user?.userId);
    return formatSuccessResponse(expense, '成功更新 Expense');
  }

  /**
   * 刪除 Expense
   * 
   * HTTP: DELETE /expenses/1
   */
  @Delete(':id')
  @UseGuards(OptionalJwtGuard)
  async remove(
    @Param('id') id: string,
    @Headers('x-member-token') memberToken: string,
    @Req() req,
  ) {
    const result = await this.expensesService.remove(+id, memberToken, req.user?.userId);
    return formatSuccessResponse(result, '成功刪除 Expense');
  }
}
