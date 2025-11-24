import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log('Checking __drizzle_migrations table...');
  try {
    const result = await client`SELECT * FROM "__drizzle_migrations" ORDER BY created_at DESC`;
    console.table(result);
  } catch (error) {
    console.error('Error querying migrations:', error);
  }
  process.exit(0);
}

main();
