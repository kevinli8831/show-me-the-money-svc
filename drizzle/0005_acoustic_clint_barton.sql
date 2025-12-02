ALTER TYPE "public"."user_type_enum" ADD VALUE 'guest';--> statement-breakpoint
ALTER TABLE "activity_members" ADD COLUMN "member_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_members" ADD COLUMN "is_virtual" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_members" ADD COLUMN "is_guest" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "activity_members" ADD CONSTRAINT "activity_members_member_token_unique" UNIQUE("member_token");