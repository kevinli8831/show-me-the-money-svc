ALTER TABLE "users" ADD COLUMN "user_type" varchar(20) DEFAULT 'email' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_registered";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_virtual";