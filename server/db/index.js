// @ts-check

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

// локальный запуск (в docker переменные приходят из compose и не переопределяются)
try {
	process.loadEnvFile();
} catch {
	// .env отсутствует
}

const pool = new pg.Pool({
	host: process.env.DATABASE_HOST ?? "localhost",
	port: Number(process.env.DATABASE_PORT ?? 5432),
	user: process.env.DATABASE_USER ?? "postgres",
	password: process.env.DATABASE_PASSWORD ?? "postgres",
	database: process.env.DATABASE_NAME ?? "app_development",
});

export const db = drizzle({ client: pool, schema });
