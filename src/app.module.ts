import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PaymentsModule } from './payments/payments.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import 'winston-daily-rotate-file';

/**
 * AppModule - NestJS 嘅根 Module
 * 
 * 用途：
 * - 組織同管理所有 modules
 * - 設定全局配置（例如環境變數）
 * - Import 所有 feature modules (Users, Trips, Expenses, Payments)
 */
@Module({
  imports: [
    /**
     * ConfigModule - 環境變數管理
     * 
     * 多環境設定：
     * - Development: 載入 .env.development
     * - Production: 載入 .env.production
     * - Fallback: 如果對應嘅檔案唔存在，會載入 .env
     * 
     * 點樣運作：
     * 1. package.json 嘅 scripts 會 set NODE_ENV
     *    - "dev": "cross-env NODE_ENV=development nest start --watch"
     *    - "start:prod": "cross-env NODE_ENV=production node dist/main"
     * 
     * 2. ConfigModule 根據 NODE_ENV 載入對應嘅 .env file
     *    - NODE_ENV=development -> .env.development
     *    - NODE_ENV=production -> .env.production
     *    - 冇 NODE_ENV -> .env.development (預設)
     * 
     * 3. 如果對應嘅 file 唔存在，會 fallback 去 .env
     * 
     * isGlobal: true 嘅作用：
     * - 令到所有 modules 都可以直接用 ConfigService
     * - 唔使係每個 module 都 import ConfigModule
     * 
     * 例子：
     * - 係 DrizzleProvider 入面可以直接 inject ConfigService
     * - configService.get('DATABASE_URL') 就可以拎到環境變數
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),

    /**
     * WinstonModule - Logging System
     * 
     * 用途：
     * - 取代 NestJS 預設 Logger
     * - Output logs 去 Console (有色) 同 File (JSON format)
     * 
     * Transports:
     * 1. Console: 開發時睇，有色，pretty print
     * 2. File (logs/error.log): 只記 error，JSON format
     * 3. File (logs/combined.log): 記所有野，JSON format
     */
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('ShowMeTheMoney', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        // Error Logs - Daily Rotate
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d', // Keep error logs for 30 days
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        // Combined Logs - Daily Rotate
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d', // Keep combined logs for 14 days
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
    
    /**
     * DrizzleModule - Database ORM Module
     * 
     * 用途：
     * - 提供 Drizzle database instance 比所有 services 用
     * - 連接去 NeonDB (Postgres)
     * - 定義 database schema
     */
    DrizzleModule,
    
    /**
     * Feature Modules
     * 
     * 每個 module 負責一個 feature：
     * - UsersModule: 管理 users (CRUD)
     * - TripsModule: 管理 trips 同 trip members (CRUD + member management)
     * - ExpensesModule: 管理 expenses (CRUD)
     * - PaymentsModule: 管理 payments (CRUD)
     */
    UsersModule,
    TripsModule,
    ExpensesModule,
    ExpenseCategoriesModule,
    PaymentsModule,
    HealthModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
