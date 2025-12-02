import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggingInterceptor } from './logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as net from 'net';

/**
 * Check if a port is available
 */
async function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Bootstrap Function - 啟動 NestJS Application
 * 
 * 主要設定：
 * 1. ValidationPipe: 自動驗證同轉換 DTO
 * 2. Swagger: API 文檔 UI
 * 3. Port: 從環境變數讀取，預設 5678 (如果被佔用會自動 +1)
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Winston as the global logger
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Enable CORS
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:8081';

  app.enableCors({
    origin: true, // Reflect the request origin. This allows all origins AND credentials.
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

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

  // Apply LoggingInterceptor globally
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Apply HttpExceptionFilter globally to format all error responses
  app.useGlobalFilters(new HttpExceptionFilter());

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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // 移除未在 DTO 中定義的屬性
      forbidNonWhitelisted: true, // 發現多餘屬性時拋錯
      transform: true,          // 自動把字串轉成數字、日期等
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Show Me The Money API')
    .setDescription('The Show Me The Money API description')
    .setVersion('1.0')
    .addBearerAuth()
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
   * 自動 Port Increment:
   * 如果 Port 被佔用，會自動試下一個 (e.g. 3000 -> 3001)
   */
  const configPort = parseInt(process.env.PORT ?? '5678', 10);
  const port = configPort;

  if (port !== configPort) {
    logger.warn(`Port ${configPort} is in use, switching to ${port}`);
  }

  await app.listen(port);

  // 獲取當前環境
  const env = process.env.NODE_ENV || 'development';
  const baseUrl = await app.getUrl();

  // 顯示啟動資訊
  logger.log('='.repeat(60));
  logger.log(`🚀 Application is running!`);
  logger.log('='.repeat(60));
  logger.log(`📦 Environment: ${env}`);
  logger.log(`🌐 Server URL: ${baseUrl}`);
  logger.log(`📚 Swagger API Docs: ${baseUrl}/api`);
  logger.log('='.repeat(60));
}

bootstrap();
