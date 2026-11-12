// @ts-check

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

const cookiesFrom = (
	/** @type {{ headers: Record<string, string | string[] | undefined> }} */ res,
) => {
	const setCookie = res.headers["set-cookie"] ?? [];
	const rawCookies = Array.isArray(setCookie) ? setCookie : [setCookie];
	return rawCookies.map((cookie) => cookie.split(";")[0]);
};

const mergeCookies = (/** @type {string[]} */ ...headers) => {
	const pairs = new Map();
	headers
		.filter(Boolean)
		.flatMap((header) => header.split("; "))
		.forEach((pair) => {
			const separator = pair.indexOf("=");
			pairs.set(pair.slice(0, separator), pair);
		});
	return [...pairs.values()].join("; ");
};

const registerAndLogin = async (/** @type {Record<string, string>} */ data) => {
	const registerRes = await postForm("/users", data);
	const loginRes = await postForm(
		"/sessions",
		{ email: data.email, password: data.password },
		mergeCookies(...cookiesFrom(registerRes)),
	);

	return mergeCookies(...cookiesFrom(registerRes), ...cookiesFrom(loginRes));
};

describe("DELETE /users/:id", () => {
	it("redirects an anonymous user to the root page", async () => {
		const other = await createUser({
			email: "other@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const res = await app.inject({
			method: "DELETE",
			url: `/users/${other.id}`,
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const unchanged = await db.query.users.findFirst({
			where: eq(users.id, other.id),
		});
		expect(unchanged).toBeDefined();
	});

	it("rejects an anonymous form submission through the _method override", async () => {
		const other = await createUser({
			email: "other@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const res = await app.inject({
			method: "POST",
			url: `/users/${other.id}`,
			headers: { "content-type": "application/x-www-form-urlencoded" },
			payload: "_method=DELETE",
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const unchanged = await db.query.users.findFirst({
			where: eq(users.id, other.id),
		});
		expect(unchanged).toBeDefined();
	});

	it("deletes another user and redirects to the users list", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const other = await createUser({
			email: "other@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const res = await app.inject({
			method: "DELETE",
			url: `/users/${other.id}`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/users");

		const deleted = await db.query.users.findFirst({
			where: eq(users.id, other.id),
		});
		expect(deleted).toBeUndefined();
	});

	it("supports a form submission through the _method override", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const other = await createUser({
			email: "other@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const res = await app.inject({
			method: "POST",
			url: `/users/${other.id}`,
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				cookie,
			},
			payload: "_method=DELETE",
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/users");

		const deleted = await db.query.users.findFirst({
			where: eq(users.id, other.id),
		});
		expect(deleted).toBeUndefined();
	});

	it("shows a success flash message after redirect", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const other = await createUser({
			email: "other@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const deleteRes = await app.inject({
			method: "DELETE",
			url: `/users/${other.id}`,
			headers: { cookie },
		});
		const pageRes = await app.inject({
			method: "GET",
			url: "/users",
			headers: { cookie: mergeCookies(cookie, ...cookiesFrom(deleteRes)) },
		});

		expect(pageRes.statusCode).toBe(200);
		expect(pageRes.body).toContain("alert-success");
		expect(pageRes.body).toContain("User deleted successfully");
	});

	it("logs the current user out when deleting their own account", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await app.inject({
			method: "DELETE",
			url: `/users/${user?.id}`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const deleted = await db.query.users.findFirst({
			where: eq(users.id, user?.id ?? 0),
		});
		expect(deleted).toBeUndefined();

		const nextCookie = mergeCookies(...cookiesFrom(res));
		const listRes = await app.inject({
			method: "GET",
			url: "/users",
			headers: { cookie: nextCookie },
		});
		expect(listRes.statusCode).toBe(200);

		const editRes = await app.inject({
			method: "GET",
			url: `/users/${user?.id}/edit`,
			headers: { cookie: nextCookie },
		});
		expect(editRes.statusCode).toBe(302);
		expect(editRes.headers.location).toBe("/");
	});

	it("returns 404 for a missing user", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await app.inject({
			method: "DELETE",
			url: "/users/999999",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(404);
	});
});
