import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/drizzle/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_s1y2rMgqNaRj@ep-falling-tooth-a1xny2x1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
