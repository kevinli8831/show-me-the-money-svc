CREATE TYPE "public"."user_type_enum" AS ENUM('virtual', 'email', 'google', 'apple');--> statement-breakpoint
CREATE TYPE "public"."split_method_enum" AS ENUM('equal', 'percentage', 'custom');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DEFAULT 'email'::"public"."user_type_enum";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "user_type" SET DATA TYPE "public"."user_type_enum" USING "user_type"::"public"."user_type_enum";--> statement-breakpoint
ALTER TABLE "expense_splits" ALTER COLUMN "split_method" SET DEFAULT 'equal'::"public"."split_method_enum";--> statement-breakpoint
ALTER TABLE "expense_splits" ALTER COLUMN "split_method" SET DATA TYPE "public"."split_method_enum" USING "split_method"::"public"."split_method_enum";