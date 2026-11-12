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

const logoutViaForm = (/** @type {string} */ cookie) =>
	app.inject({
		method: "POST",
		url: "/session",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
			cookie,
		},
		payload: "_method=DELETE",
	});

describe("DELETE /session", () => {
	it("logs the current user out through the form override", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await logoutViaForm(cookie);

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const nextCookie = mergeCookies(cookie, ...cookiesFrom(res));

		const pageRes = await app.inject({
			method: "GET",
			url: "/",
			headers: { cookie: nextCookie },
		});
		expect(pageRes.statusCode).toBe(200);
		expect(pageRes.body).toContain("alert-success");
		expect(pageRes.body).toContain("You are logged out");

		const editRes = await app.inject({
			method: "GET",
			url: `/users/${user?.id}/edit`,
			headers: { cookie: nextCookie },
		});
		expect(editRes.statusCode).toBe(302);
		expect(editRes.headers.location).toBe("/");
	});

	it("accepts a direct DELETE request", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await app.inject({
			method: "DELETE",
			url: "/session",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const editRes = await app.inject({
			method: "GET",
			url: `/users/${user?.id}/edit`,
			headers: { cookie: mergeCookies(cookie, ...cookiesFrom(res)) },
		});
		expect(editRes.statusCode).toBe(302);
		expect(editRes.headers.location).toBe("/");
	});

	it("rejects an anonymous request", async () => {
		const res = await app.inject({ method: "DELETE", url: "/session" });

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const pageRes = await app.inject({
			method: "GET",
			url: "/",
			headers: { cookie: mergeCookies(...cookiesFrom(res)) },
		});
		expect(pageRes.statusCode).toBe(200);
		expect(pageRes.body).toContain("alert-danger");
		expect(pageRes.body).toContain("Access denied! Please login");
	});
});

describe("logout button", () => {
	it("is shown to an authenticated user", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await app.inject({
			method: "GET",
			url: "/",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain('action="/session"');
		expect(res.body).toContain('name="_method"');
		expect(res.body).toContain('value="DELETE"');
		expect(res.body).toContain("Logout");
	});

	it("is hidden from an anonymous user", async () => {
		const res = await app.inject({ method: "GET", url: "/" });

		expect(res.statusCode).toBe(200);
		expect(res.body).not.toContain('action="/session"');
	});
});
