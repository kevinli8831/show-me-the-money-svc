import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Bootstrap Function - 啟動 NestJS Application
 * 
 * 主要設定：
 * 1. ValidationPipe: 自動驗證同轉換 DTO
 * 2. Swagger: API 文檔 UI
 * 3. Port: 從環境變數讀取，預設 5678
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * 啟用全局 ValidationPipe
   * 
   * transform: true 嘅作用：
   * - 自動將 JSON 轉做對應嘅 DTO type
   * - 例如：JSON string "2025-10-23" -> Date object (配合 @Type(() => Date))
   * - 例如：JSON number 123 -> TypeScript number (配合 @Type(() => Number))
   * 
   * 如果冇 transform: true：
   * - 所有 JSON value 都會保持原本嘅 type (string, number, etc.)
   * - @Type() decorator 唔會生效
   */
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  /**
   * Swagger 設定
   * 
   * 用途：
   * - 自動生成 API 文檔
   * - 提供 interactive UI 去 test API
   * - 訪問 http://localhost:5678/api 就可以睇到
   * 
   * DocumentBuilder:
   * - setTitle: API 文檔標題
   * - setDescription: API 文檔描述
   * - setVersion: API 版本號
   */
  const config = new DocumentBuilder()
    .setTitle('Show Me The Money API')
    .setDescription('The Show Me The Money API description')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  /**
   * SwaggerModule.setup('api', app, document)
   * - 第一個參數 'api' 係 Swagger UI 嘅 path
   * - 即係訪問 http://localhost:5678/api 就會見到 Swagger UI
   */
  SwaggerModule.setup('api', app, document);

  /**
   * 啟動 server
   * 
   * Port 優先級：
   * 1. process.env.PORT (從 .env 檔案讀取)
   * 2. 5678 (預設值)
   * 
   * 例如：
   * - Development: .env.development 設定 PORT=5678
   * - Production: .env.production 設定 PORT=3000
   */
  await app.listen(process.env.PORT ?? 5678);
}

bootstrap();
