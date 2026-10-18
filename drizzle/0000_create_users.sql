CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"passwordDigest" varchar(255) NOT NULL,
	"firstName" varchar(255),
	"lastName" varchar(255),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
