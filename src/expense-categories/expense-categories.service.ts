import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * ExpenseCategoriesService - 處理所有 Expense Category 相關嘅業務邏輯
 * 
 * 主要功能：
 * - CRUD operations for expense categories
 * - 提供預設 categories 俾 frontend select box 使用
 */
@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @Inject(DrizzleAsyncProvider) private readonly db: NeonHttpDatabase<typeof schema>,
  ) {}

  /**
   * 建立新 Category
   */
  async create(createDto: CreateExpenseCategoryDto) {
    const [category] = await this.db
      .insert(schema.expenseCategories)
      .values(createDto)
      .returning();
    return category;
  }

  /**
   * 獲取所有 Active Categories
   * 
   * 只返回 isActive = true 嘅 categories
   */
  async findAll() {
    return this.db.query.expenseCategories.findMany({
      where: eq(schema.expenseCategories.isActive, true),
    });
  }

  /**
   * 根據 ID 獲取單個 Category
   */
  async findOne(id: number) {
    const category = await this.db.query.expenseCategories.findFirst({
      where: eq(schema.expenseCategories.id, id),
    });

    if (!category) {
      throw new NotFoundException(`Expense Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * 更新 Category
   */
  async update(id: number, updateDto: UpdateExpenseCategoryDto) {
    const [category] = await this.db
      .update(schema.expenseCategories)
      .set(updateDto)
      .where(eq(schema.expenseCategories.id, id))
      .returning();

    if (!category) {
      throw new NotFoundException(`Expense Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * 刪除 Category（Soft Delete）
   * 
   * 設 isActive = false，唔會真正刪除
   */
  async remove(id: number) {
    const [category] = await this.db
      .update(schema.expenseCategories)
      .set({ isActive: false })
      .where(eq(schema.expenseCategories.id, id))
      .returning();

    if (!category) {
      throw new NotFoundException(`Expense Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Seed 預設 Categories
   * 
   * 用於初始化 database，建立預設嘅 categories
   */
  async seed() {
    const defaultCategories = [
      { name: '食飯', icon: '🍔', color: '#FF5733' },
      { name: '交通', icon: '🚗', color: '#3498DB' },
      { name: '住宿', icon: '🏨', color: '#9B59B6' },
      { name: '娛樂', icon: '🎬', color: '#E74C3C' },
      { name: '購物', icon: '🛍️', color: '#F39C12' },
      { name: '其他', icon: '📦', color: '#95A5A6' },
    ];

    const results: any[] = [];
    for (const category of defaultCategories) {
      // 檢查係咪已經存在
      const existing = await this.db.query.expenseCategories.findFirst({
        where: eq(schema.expenseCategories.name, category.name),
      });

      if (!existing) {
        const [created] = await this.db
          .insert(schema.expenseCategories)
          .values(category)
          .returning();
        results.push(created);
      }
    }

    return {
      message: `Seeded ${results.length} categories`,
      categories: results,
    };
  }
}
