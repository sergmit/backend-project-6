// @ts-check

import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "@jest/globals";
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

describe("GET /users", () => {
	it("renders the list for an anonymous user without delete controls", async () => {
		const other = await createUser({
			email: "jane@example.com",
			password: "secret123",
			firstName: "Jane",
			lastName: "Smith",
		});

		const res = await app.inject({ method: "GET", url: "/users" });

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain("jane@example.com");
		expect(res.body).toContain("Jane");
		expect(res.body).toContain("Smith");
		expect(res.body).not.toContain(`action="/users/${other.id}"`);
		expect(res.body).not.toContain('name="_method"');
		expect(res.body).not.toContain('value="DELETE"');
		expect(res.body).not.toContain("Delete");
	});

	it("renders all users with delete buttons for an authenticated user", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
			firstName: "John",
			lastName: "Doe",
		});
		const other = await createUser({
			email: "jane@example.com",
			password: "secret123",
			firstName: "Jane",
			lastName: "Smith",
		});

		const res = await app.inject({
			method: "GET",
			url: "/users",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain("john@example.com");
		expect(res.body).toContain("jane@example.com");
		expect(res.body).toContain("John");
		expect(res.body).toContain("Smith");
		expect(res.body).toContain(`action="/users/${other.id}"`);
		expect(res.body).toContain('name="_method"');
		expect(res.body).toContain('value="DELETE"');
		expect(res.body).toContain("Delete");
	});

	it("adds a users link to the navigation for authenticated users", async () => {
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
		expect(res.body).toContain('href="/users"');
		expect(res.body).toContain("Users");
	});

	it("shows the users link to anonymous users", async () => {
		const res = await app.inject({ method: "GET", url: "/" });

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain('href="/users"');
		expect(res.body).toContain("Users");
	});
});
