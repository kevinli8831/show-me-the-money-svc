import { sql } from "drizzle-orm";

export const up = sql`
ALTER TABLE "trips" 
ALTER COLUMN "creator_user_id" TYPE bigint 
USING "creator_user_id"::bigint;
`;

export const down = sql`
ALTER TABLE "trips" 
ALTER COLUMN "creator_user_id" TYPE varchar;
`;
