CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"trip_id" bigint,
	"performed_by_user_id" bigint,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "expense_payers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expense_splits" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "expense_payers" CASCADE;--> statement-breakpoint
DROP TABLE "expense_splits" CASCADE;--> statement-breakpoint
ALTER TABLE "trips" DROP CONSTRAINT "trips_creator_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_category_id_expense_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "trip_members" DROP CONSTRAINT "trip_members_trip_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "trip_members" ALTER COLUMN "user_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "trip_members" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DATA TYPE varchar(3);--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DEFAULT 'HKD';--> statement-breakpoint
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_member_token_pk" PRIMARY KEY("trip_id","member_token");--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "share_code" varchar(8) NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD COLUMN "creator_member_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "description" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "participant_tokens" text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "paid_amounts" numeric(12, 2)[] NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "share_amounts" numeric(12, 2)[] NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "created_by_token" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "note";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "receipt_image_url";--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_share_code_unique" UNIQUE("share_code");--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_creator_member_token_unique" UNIQUE("creator_member_token");--> statement-breakpoint
DROP TYPE "public"."split_method_enum";