// @ts-check

import crypto from "node:crypto";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "@jest/globals";
import { eq } from "drizzle-orm";
import { db } from "../server/db/index.js";
import { users } from "../server/db/schema.js";
import { createUser } from "../server/lib/users.js";
import { buildApp } from "./helpers/app.js";

/** @type {import('fastify').FastifyInstance} */
let app;

beforeAll(async () => {
	app = await buildApp();
});

afterAll(async () => {
	await app.close();
});

beforeEach(async () => {
	await db.delete(users);
});

const encodeForm = (/** @type {Record<string, string>} */ data) =>
	new URLSearchParams(
		Object.entries(data).map(([key, value]) => [`data[${key}]`, value]),
	).toString();

const postForm = (
	/** @type {string} */ url,
	/** @type {Record<string, string>} */ data,
	/** @type {string | undefined} */ cookie,
) =>
	app.inject({
		method: "POST",
		url,
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			...(cookie ? { cookie } : {}),
		},
		payload: encodeForm(data),
	});

const cookieHeader = (
	/** @type {{ headers: Record<string, string | string[] | undefined> }} */ res,
) => {
	const setCookie = res.headers["set-cookie"] ?? [];
	const rawCookies = Array.isArray(setCookie) ? setCookie : [setCookie];
	return rawCookies.map((cookie) => cookie.split(";")[0]).join("; ");
};

const sha256 = (/** @type {string} */ value) =>
	crypto.createHash("sha256").update(value).digest("hex");

describe("GET /users/new", () => {
	it("renders the registration form", async () => {
		const res = await app.inject({ method: "GET", url: "/users/new" });

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain('action="/users"');
		expect(res.body).toContain('name="data[email]"');
		expect(res.body).toContain('name="data[password]"');
		expect(res.body).toContain('type="password"');
		expect(res.body).toContain('name="data[firstName]"');
		expect(res.body).toContain('name="data[lastName]"');
		expect(res.body).toContain('href="/sessions/new"');
		expect(res.body).toContain('href="/users/new"');
	});
});

describe("POST /users", () => {
	it("registers a new user and redirects to the login page", async () => {
		const res = await postForm("/users", {
			email: "john@example.com",
			password: "secret123",
			firstName: "John",
			lastName: "Doe",
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/sessions/new");

		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});
		expect(user).toBeDefined();
		expect(user?.passwordDigest).toBe(sha256("secret123"));
		expect(user?.firstName).toBe("John");
		expect(user?.lastName).toBe("Doe");
	});

	it("shows a success flash message after redirect", async () => {
		const registerRes = await postForm("/users", {
			email: "john@example.com",
			password: "secret123",
		});
		const cookie = cookieHeader(registerRes);

		const pageRes = await app.inject({
			method: "GET",
			url: "/sessions/new",
			headers: { cookie },
		});

		expect(pageRes.statusCode).toBe(200);
		expect(pageRes.body).toContain("alert-success");
		expect(pageRes.body).toContain("User registered successfully");
	});

	it("rejects an invalid email", async () => {
		const res = await postForm("/users", {
			email: "not-an-email",
			password: "secret123",
		});

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("Invalid email");

		const user = await db.query.users.findFirst();
		expect(user).toBeUndefined();
	});

	it("rejects a missing password", async () => {
		const res = await postForm("/users", {
			email: "john@example.com",
			password: "",
		});

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("Password is required");

		const user = await db.query.users.findFirst();
		expect(user).toBeUndefined();
	});

	it("rejects a missing email", async () => {
		const res = await postForm("/users", {
			email: "",
			password: "secret123",
		});

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("Email is required");
	});

	it("rejects a duplicate email", async () => {
		await createUser({
			email: "taken@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const res = await postForm("/users", {
			email: "taken@example.com",
			password: "secret123",
		});

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("This email is already taken");

		const allUsers = await db.query.users.findMany();
		expect(allUsers).toHaveLength(1);
	});

	it("keeps submitted values in the form on validation errors", async () => {
		const res = await postForm("/users", {
			email: "not-an-email",
			password: "secret123",
			firstName: "John",
		});

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain('value="not-an-email"');
		expect(res.body).toContain('value="John"');
	});
});
