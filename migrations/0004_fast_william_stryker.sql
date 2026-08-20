CREATE TABLE "cod_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" uuid NOT NULL,
	"platform" varchar(20) NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"order_number" varchar(100),
	"customer_phone" varchar(20) NOT NULL,
	"customer_name" varchar(255),
	"total_price" varchar(50),
	"currency" varchar(10),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"whatsapp_message_id" varchar(255),
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
