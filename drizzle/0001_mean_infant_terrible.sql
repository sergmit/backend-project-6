CREATE TABLE "task_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"statusId" integer NOT NULL,
	"creatorId" integer NOT NULL,
	"executorId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_statusId_task_statuses_id_fk" FOREIGN KEY ("statusId") REFERENCES "public"."task_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creatorId_users_id_fk" FOREIGN KEY ("creatorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_executorId_users_id_fk" FOREIGN KEY ("executorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;