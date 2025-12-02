import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { formatSuccessResponse } from '../common/helpers';

/**
 * ExpenseCategoriesController - 處理所有 /expense-categories 開頭嘅 HTTP requests
 * 
 * API Endpoints:
 * - GET    /expense-categories       獲取所有 active categories
 * - POST   /expense-categories       建立新 category
 * - GET    /expense-categories/:id   獲取單個 category
 * - PATCH  /expense-categories/:id   更新 category
 * - DELETE /expense-categories/:id   刪除 category (soft delete)
 * - POST   /expense-categories/seed  Seed 預設 categories
 */
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) { }

  /**
   * 建立新 Category
   * 
   * HTTP: POST /expense-categories
   * Request Body 例子:
   * {
   *   "name": "醫療",
   *   "icon": "🏥",
   *   "color": "#2ECC71"
   * }
   */
  @Post()
  async create(@Body() createDto: CreateExpenseCategoryDto) {
    const category = await this.expenseCategoriesService.create(createDto);
    return formatSuccessResponse(category, '成功創建 Category');
  }

  /**
   * Seed 預設 Categories
   * 
   * HTTP: POST /expense-categories/seed
   * 
   * 用於初始化 database，建立預設嘅 categories
   */
  @Post('seed')
  async seed() {
    const result = await this.expenseCategoriesService.seed();
    return formatSuccessResponse(result, '成功 Seed Categories');
  }

  /**
   * 獲取所有 Active Categories
   * 
   * HTTP: GET /expense-categories
   * 
   * 只返回 isActive = true 嘅 categories
   */
  @Get()
  async findAll() {
    const categories = await this.expenseCategoriesService.findAll();
    return formatSuccessResponse(categories, '成功獲取 Categories');
  }

  /**
   * 獲取單個 Category
   * 
   * HTTP: GET /expense-categories/1
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.expenseCategoriesService.findOne(+id);
    return formatSuccessResponse(category, '成功獲取 Category');
  }

  /**
   * 更新 Category
   * 
   * HTTP: PATCH /expense-categories/1
   * Request Body 例子:
   * {
   *   "name": "醫療費用",
   *   "color": "#27AE60"
   * }
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateExpenseCategoryDto) {
    const category = await this.expenseCategoriesService.update(+id, updateDto);
    return formatSuccessResponse(category, '成功更新 Category');
  }

  /**
   * 刪除 Category（Soft Delete）
   * 
   * HTTP: DELETE /expense-categories/1
   * 
   * 設 isActive = false，唔會真正刪除
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.expenseCategoriesService.remove(+id);
    return formatSuccessResponse(result, '成功刪除 Category');
  }
}
