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

const patchForm = (
	/** @type {string} */ url,
	/** @type {Record<string, string>} */ data,
	/** @type {string | undefined} */ cookie,
) =>
	app.inject({
		method: "PATCH",
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

const sha256 = (/** @type {string} */ value) =>
	crypto.createHash("sha256").update(value).digest("hex");

describe("GET /users/:id/edit", () => {
	it("redirects an anonymous user to the root page", async () => {
		const res = await app.inject({ method: "GET", url: "/users/1/edit" });

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");
	});

	it("renders the edit form with the current values", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
			firstName: "John",
			lastName: "Doe",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await app.inject({
			method: "GET",
			url: `/users/${user?.id}/edit`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain(`action="/users/${user?.id}"`);
		expect(res.body).toContain('name="_method"');
		expect(res.body).toContain('value="PATCH"');
		expect(res.body).toContain('name="data[email]"');
		expect(res.body).toContain('value="john@example.com"');
		expect(res.body).toContain('value="John"');
		expect(res.body).toContain('value="Doe"');
		expect(res.body).not.toContain('name="data[password]"');
	});

	it("forbids editing another user", async () => {
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
			method: "GET",
			url: `/users/${other.id}/edit`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");
	});
});

describe("GET /users/:id", () => {
	it("renders the profile of the current user", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
			firstName: "John",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await app.inject({
			method: "GET",
			url: `/users/${user?.id}`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain("john@example.com");
		expect(res.body).toContain(`href="/users/${user?.id}/edit"`);
	});
});

describe("PATCH /users/:id", () => {
	it("updates the current user and redirects to the profile", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
			firstName: "John",
			lastName: "Doe",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await patchForm(
			`/users/${user?.id}`,
			{
				email: "john.updated@example.com",
				firstName: "Johnny",
				lastName: "Updated",
			},
			cookie,
		);

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe(`/users/${user?.id}`);

		const updated = await db.query.users.findFirst({
			where: eq(users.id, user?.id ?? 0),
		});
		expect(updated?.email).toBe("john.updated@example.com");
		expect(updated?.firstName).toBe("Johnny");
		expect(updated?.lastName).toBe("Updated");
		expect(updated?.passwordDigest).toBe(sha256("secret123"));
	});

	it("supports a form submission through the _method override", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await app.inject({
			method: "POST",
			url: `/users/${user?.id}`,
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				cookie,
			},
			payload: `${encodeForm({
				email: "john.updated@example.com",
				firstName: "Johnny",
			})}&_method=PATCH`,
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe(`/users/${user?.id}`);

		const updated = await db.query.users.findFirst({
			where: eq(users.id, user?.id ?? 0),
		});
		expect(updated?.email).toBe("john.updated@example.com");
		expect(updated?.firstName).toBe("Johnny");
	});

	it("shows a success flash message after redirect", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const updateRes = await patchForm(
			`/users/${user?.id}`,
			{ email: "john.updated@example.com" },
			cookie,
		);
		const pageRes = await app.inject({
			method: "GET",
			url: `/users/${user?.id}`,
			headers: { cookie: mergeCookies(cookie, ...cookiesFrom(updateRes)) },
		});

		expect(pageRes.statusCode).toBe(200);
		expect(pageRes.body).toContain("alert-success");
		expect(pageRes.body).toContain("User updated successfully");
	});

	it("rejects an invalid email and keeps the submitted values", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await patchForm(
			`/users/${user?.id}`,
			{ email: "not-an-email", firstName: "Jane" },
			cookie,
		);

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("Invalid email");
		expect(res.body).toContain('value="not-an-email"');
		expect(res.body).toContain('value="Jane"');
	});

	it("rejects an email that belongs to another user", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});
		await createUser({
			email: "taken@example.com",
			password: "secret123",
			firstName: null,
			lastName: null,
		});

		const res = await patchForm(
			`/users/${user?.id}`,
			{ email: "taken@example.com" },
			cookie,
		);

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("This email is already taken");

		const unchanged = await db.query.users.findFirst({
			where: eq(users.id, user?.id ?? 0),
		});
		expect(unchanged?.email).toBe("john@example.com");
	});

	it("allows keeping the same email", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const user = await db.query.users.findFirst({
			where: eq(users.email, "john@example.com"),
		});

		const res = await patchForm(
			`/users/${user?.id}`,
			{ email: "john@example.com", firstName: "Johnny" },
			cookie,
		);

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe(`/users/${user?.id}`);
	});

	it("forbids updating another user", async () => {
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

		const res = await patchForm(
			`/users/${other.id}`,
			{ email: "hacked@example.com" },
			cookie,
		);

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");

		const unchanged = await db.query.users.findFirst({
			where: eq(users.id, other.id),
		});
		expect(unchanged?.email).toBe("other@example.com");
	});
});
