CREATE TABLE "abandoned_cart_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"automation_id" varchar NOT NULL,
	"reminder_id" varchar(100) NOT NULL,
	"template_node_id" varchar(100) NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abandoned_cart_reminders_unique" UNIQUE("cart_id","reminder_id")
);
--> statement-breakpoint
CREATE TABLE "abandoned_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"contact_id" uuid,
	"checkout_token" text NOT NULL,
	"cart_token" text,
	"email" text,
	"phone" text,
	"customer_name" text,
	"recovery_url" text,
	"currency" varchar(10),
	"subtotal_price" numeric(12, 2),
	"total_price" numeric(12, 2),
	"product_data" jsonb,
	"platform" varchar(50) DEFAULT 'shopify' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"last_reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abandoned_carts_checkout_token_unique" UNIQUE("checkout_token")
);
--> statement-breakpoint
CREATE TABLE "ecommerce_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(50) NOT NULL,
	"client_id" text,
	"client_secret" text,
	"app_url" text,
	"callback_url" text,
	"webhook_url" text,
	"scopes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopify_stores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"shop_domain" text NOT NULL,
	"shop_name" text,
	"access_token" text NOT NULL,
	"scopes" text,
	"last_synced_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"channel_id" varchar,
	"installed_at" timestamp with time zone,
	"uninstalled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shopify_stores_shop_domain_unique" UNIQUE("shop_domain")
);
--> statement-breakpoint
CREATE TABLE "woocommerce_stores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"channel_id" varchar NOT NULL,
	"store_name" text,
	"store_url" text NOT NULL,
	"consumer_key" text NOT NULL,
	"consumer_secret" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "audience_type" text DEFAULT 'all';--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "platform" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "store_id" varchar;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "abandoned_cart_reminders" ADD CONSTRAINT "abandoned_cart_reminders_cart_id_abandoned_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."abandoned_carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_cart_reminders" ADD CONSTRAINT "abandoned_cart_reminders_automation_id_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_store_id_shopify_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."shopify_stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_stores" ADD CONSTRAINT "shopify_stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopify_stores" ADD CONSTRAINT "shopify_stores_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "woocommerce_stores" ADD CONSTRAINT "woocommerce_stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "woocommerce_stores" ADD CONSTRAINT "woocommerce_stores_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "abandoned_cart_reminders_cart_idx" ON "abandoned_cart_reminders" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "abandoned_cart_reminders_automation_idx" ON "abandoned_cart_reminders" USING btree ("automation_id");--> statement-breakpoint
CREATE INDEX "abandoned_cart_reminders_scheduled_idx" ON "abandoned_cart_reminders" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "abandoned_cart_reminders_status_idx" ON "abandoned_cart_reminders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "abandoned_carts_store_idx" ON "abandoned_carts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "abandoned_carts_channel_idx" ON "abandoned_carts" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "abandoned_carts_contact_idx" ON "abandoned_carts" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "abandoned_carts_status_idx" ON "abandoned_carts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shopify_stores_user_id_idx" ON "shopify_stores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shopify_stores_shop_domain_idx" ON "shopify_stores" USING btree ("shop_domain");--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_store_id_shopify_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."shopify_stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_store_idx" ON "contacts" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "contacts_external_id_idx" ON "contacts" USING btree ("external_id");--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_store_external_unique" UNIQUE("store_id","external_id");