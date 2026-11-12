// @ts-check

import { defineConfig } from "drizzle-kit";

// локальный запуск (в docker переменные приходят из compose и не переопределяются)
try {
	process.loadEnvFile();
} catch {
	// .env отсутствует
}

export default defineConfig({
	schema: "./server/db/schema.js",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		host: process.env.DATABASE_HOST ?? "localhost",
		port: Number(process.env.DATABASE_PORT ?? 5432),
		user: process.env.DATABASE_USER ?? "postgres",
		password: process.env.DATABASE_PASSWORD ?? "postgres",
		database: process.env.DATABASE_NAME ?? "app_development",
	},
});
