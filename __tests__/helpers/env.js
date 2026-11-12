// @ts-check

export const testEnv = {
	DATABASE_HOST: process.env.DATABASE_HOST ?? "localhost",
	DATABASE_PORT: process.env.DATABASE_PORT ?? "5432",
	DATABASE_USER: process.env.DATABASE_USER ?? "postgres",
	DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? "postgres",
	DATABASE_NAME: "app_test",
	SESSION_KEY:
		"test_session_key_0123456789abcdef0123456789abcdef0123456789abcdef",
};

Object.assign(process.env, testEnv);
