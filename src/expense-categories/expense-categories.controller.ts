import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

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
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

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
  create(@Body() createDto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(createDto);
  }

  /**
   * Seed 預設 Categories
   * 
   * HTTP: POST /expense-categories/seed
   * 
   * 用於初始化 database，建立預設嘅 categories
   */
  @Post('seed')
  seed() {
    return this.expenseCategoriesService.seed();
  }

  /**
   * 獲取所有 Active Categories
   * 
   * HTTP: GET /expense-categories
   * 
   * 只返回 isActive = true 嘅 categories
   */
  @Get()
  findAll() {
    return this.expenseCategoriesService.findAll();
  }

  /**
   * 獲取單個 Category
   * 
   * HTTP: GET /expense-categories/1
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expenseCategoriesService.findOne(+id);
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
  update(@Param('id') id: string, @Body() updateDto: UpdateExpenseCategoryDto) {
    return this.expenseCategoriesService.update(+id, updateDto);
  }

  /**
   * 刪除 Category（Soft Delete）
   * 
   * HTTP: DELETE /expense-categories/1
   * 
   * 設 isActive = false，唔會真正刪除
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseCategoriesService.remove(+id);
  }
}
