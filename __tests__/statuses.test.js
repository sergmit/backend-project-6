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
import { taskStatuses, users } from "../server/db/schema.js";
import { createStatus } from "../server/lib/statuses.js";
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
	await db.delete(taskStatuses);
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

describe("statuses authentication", () => {
	it.each([
		["GET", "/statuses"],
		["GET", "/statuses/new"],
		["GET", "/statuses/1/edit"],
		["POST", "/statuses"],
		["PATCH", "/statuses/1"],
		["DELETE", "/statuses/1"],
	])("redirects an anonymous %s %s to the root page", async (method, url) => {
		const res = await app.inject({
			method: /** @type {import('fastify').HTTPMethods} */ (method),
			url,
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/");
	});
});

describe("GET /statuses", () => {
	it("renders the list of statuses", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		await createStatus({ name: "In progress" });

		const res = await app.inject({
			method: "GET",
			url: "/statuses",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain("In progress");
		expect(res.body).toContain('href="/statuses/new"');
		expect(res.body).toContain('value="DELETE"');
	});

	it("renders an empty state when there are no statuses", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await app.inject({
			method: "GET",
			url: "/statuses",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain("No statuses yet");
	});
});

describe("GET /statuses/new", () => {
	it("renders the creation form", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await app.inject({
			method: "GET",
			url: "/statuses/new",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain('action="/statuses"');
		expect(res.body).toContain('name="data[name]"');
	});
});

describe("POST /statuses", () => {
	it("creates a status and redirects to the list", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await postForm("/statuses", { name: "Draft" }, cookie);

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/statuses");

		const status = await db.query.taskStatuses.findFirst({
			where: eq(taskStatuses.name, "Draft"),
		});
		expect(status).toBeDefined();
	});

	it("rejects an empty name and keeps the form values", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await postForm("/statuses", { name: "   " }, cookie);

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("Name is required");

		const statuses = await db.query.taskStatuses.findMany();
		expect(statuses).toHaveLength(0);
	});

	it("shows a success flash message after redirect", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const createRes = await postForm("/statuses", { name: "Draft" }, cookie);
		const pageRes = await app.inject({
			method: "GET",
			url: "/statuses",
			headers: { cookie: mergeCookies(cookie, ...cookiesFrom(createRes)) },
		});

		expect(pageRes.statusCode).toBe(200);
		expect(pageRes.body).toContain("alert-success");
		expect(pageRes.body).toContain("Status created successfully");
	});
});

describe("GET /statuses/:id/edit", () => {
	it("renders the edit form with the current name", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const status = await createStatus({ name: "Draft" });

		const res = await app.inject({
			method: "GET",
			url: `/statuses/${status.id}/edit`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(200);
		expect(res.body).toContain(`action="/statuses/${status.id}"`);
		expect(res.body).toContain('value="PATCH"');
		expect(res.body).toContain('value="Draft"');
	});

	it("returns 404 for a missing status", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await app.inject({
			method: "GET",
			url: "/statuses/999999/edit",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(404);
	});
});

describe("PATCH /statuses/:id", () => {
	it("updates a status and redirects to the list", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const status = await createStatus({ name: "Draft" });

		const res = await patchForm(
			`/statuses/${status.id}`,
			{ name: "Published" },
			cookie,
		);

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/statuses");

		const updated = await db.query.taskStatuses.findFirst({
			where: eq(taskStatuses.id, status.id),
		});
		expect(updated?.name).toBe("Published");
	});

	it("rejects an empty name and keeps the submitted values", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const status = await createStatus({ name: "Draft" });

		const res = await patchForm(`/statuses/${status.id}`, { name: "" }, cookie);

		expect(res.statusCode).toBe(422);
		expect(res.body).toContain("Name is required");

		const unchanged = await db.query.taskStatuses.findFirst({
			where: eq(taskStatuses.id, status.id),
		});
		expect(unchanged?.name).toBe("Draft");
	});

	it("returns 404 for a missing status", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await patchForm(
			"/statuses/999999",
			{ name: "Published" },
			cookie,
		);

		expect(res.statusCode).toBe(404);
	});
});

describe("DELETE /statuses/:id", () => {
	it("deletes a status and redirects to the list", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const status = await createStatus({ name: "Draft" });

		const res = await app.inject({
			method: "DELETE",
			url: `/statuses/${status.id}`,
			headers: { cookie },
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/statuses");

		const deleted = await db.query.taskStatuses.findFirst({
			where: eq(taskStatuses.id, status.id),
		});
		expect(deleted).toBeUndefined();
	});

	it("supports a form submission through the _method override", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});
		const status = await createStatus({ name: "Draft" });

		const res = await app.inject({
			method: "POST",
			url: `/statuses/${status.id}`,
			headers: {
				"content-type": "application/x-www-form-urlencoded",
				cookie,
			},
			payload: "_method=DELETE",
		});

		expect(res.statusCode).toBe(302);
		expect(res.headers.location).toBe("/statuses");

		const deleted = await db.query.taskStatuses.findFirst({
			where: eq(taskStatuses.id, status.id),
		});
		expect(deleted).toBeUndefined();
	});

	it("returns 404 for a missing status", async () => {
		const cookie = await registerAndLogin({
			email: "john@example.com",
			password: "secret123",
		});

		const res = await app.inject({
			method: "DELETE",
			url: "/statuses/999999",
			headers: { cookie },
		});

		expect(res.statusCode).toBe(404);
	});
});
