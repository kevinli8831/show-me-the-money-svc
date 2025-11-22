import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { ConfigService } from '@nestjs/config';

export const DrizzleAsyncProvider = 'drizzleProvider';

export const drizzleProvider: Provider = {
  provide: DrizzleAsyncProvider,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL')!;
    const sql = neon(connectionString);
    const db = drizzle(sql, { schema });
    return db;
  },
};
