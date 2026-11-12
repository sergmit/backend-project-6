CREATE TABLE "labels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"taskId" integer NOT NULL,
	"labelId" integer NOT NULL,
	CONSTRAINT "task_labels_taskId_labelId_pk" PRIMARY KEY("taskId","labelId")
);
--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_taskId_tasks_id_fk" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_labelId_labels_id_fk" FOREIGN KEY ("labelId") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;