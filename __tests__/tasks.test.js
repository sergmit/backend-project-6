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
import { taskStatuses, tasks, users } from "../server/db/schema.js";
import {
	createTask,
	deleteTask,
	findTaskById,
	findTasks,
	updateTask,
} from "../server/lib/tasks.js";
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
	await db.delete(tasks);
	await db.delete(taskStatuses);
	await db.delete(users);
});

const _encodeForm = (/** @type {Record<string, string>} */ data) =>
	new URLSearchParams(
		Object.entries(data).map(([key, value]) => [`data[${key}]`, value]),
	).toString();

describe("Tasks", () => {
	it("should create a task", async () => {
		const user = await db
			.insert(users)
			.values({
				email: "test@example.com",
				passwordDigest: "password123",
				firstName: "Test",
				lastName: "User",
			})
			.returning();

		const status = await db
			.insert(taskStatuses)
			.values({
				name: "Draft",
			})
			.returning();

		const taskData = {
			name: "Test Task",
			description: "This is a test task",
			statusId: status[0].id,
			creatorId: user[0].id,
		};

		const createdTask = await createTask(taskData);

		expect(createdTask).toHaveProperty("id");
		expect(createdTask.name).toBe("Test Task");
		expect(createdTask.description).toBe("This is a test task");
		expect(createdTask.statusId).toBe(status[0].id);
		expect(createdTask.creatorId).toBe(user[0].id);
	});

	it("should get all tasks", async () => {
		const user = await db
			.insert(users)
			.values({
				email: "test@example.com",
				passwordDigest: "password123",
				firstName: "Test",
				lastName: "User",
			})
			.returning();

		const status = await db
			.insert(taskStatuses)
			.values({
				name: "Draft",
			})
			.returning();

		await db.insert(tasks).values([
			{
				name: "Task 1",
				description: "Description 1",
				statusId: status[0].id,
				creatorId: user[0].id,
			},
			{
				name: "Task 2",
				description: "Description 2",
				statusId: status[0].id,
				creatorId: user[0].id,
			},
		]);

		const allTasks = await findTasks();

		expect(allTasks).toHaveLength(2);
		expect(allTasks[0]).toHaveProperty("name", "Task 1");
		expect(allTasks[1]).toHaveProperty("name", "Task 2");
	});

	it("should get task by id", async () => {
		const user = await db
			.insert(users)
			.values({
				email: "test@example.com",
				passwordDigest: "password123",
				firstName: "Test",
				lastName: "User",
			})
			.returning();

		const status = await db
			.insert(taskStatuses)
			.values({
				name: "Draft",
			})
			.returning();

		const createdTask = await db
			.insert(tasks)
			.values({
				name: "Test Task",
				description: "Description",
				statusId: status[0].id,
				creatorId: user[0].id,
			})
			.returning();

		const task = await findTaskById(createdTask[0].id);

		expect(task).toHaveProperty("id", createdTask[0].id);
		expect(task).toHaveProperty("name", "Test Task");
		expect(task).toHaveProperty("description", "Description");
	});

	it("should update a task", async () => {
		const user = await db
			.insert(users)
			.values({
				email: "test@example.com",
				passwordDigest: "password123",
				firstName: "Test",
				lastName: "User",
			})
			.returning();

		const status = await db
			.insert(taskStatuses)
			.values({
				name: "Draft",
			})
			.returning();

		const createdTask = await db
			.insert(tasks)
			.values({
				name: "Original Task",
				description: "Original Description",
				statusId: status[0].id,
				creatorId: user[0].id,
			})
			.returning();

		const updateData = {
			name: "Updated Task",
			description: "Updated Description",
			statusId: status[0].id,
			creatorId: user[0].id,
		};

		const updatedTask = await updateTask(createdTask[0].id, updateData);

		expect(updatedTask).toHaveProperty("name", "Updated Task");
		expect(updatedTask).toHaveProperty("description", "Updated Description");
	});

	it("should delete a task", async () => {
		const user = await db
			.insert(users)
			.values({
				email: "test@example.com",
				passwordDigest: "password123",
				firstName: "Test",
				lastName: "User",
			})
			.returning();

		const status = await db
			.insert(taskStatuses)
			.values({
				name: "Draft",
			})
			.returning();

		const createdTask = await db
			.insert(tasks)
			.values({
				name: "Task to delete",
				description: "Description",
				statusId: status[0].id,
				creatorId: user[0].id,
			})
			.returning();

		await deleteTask(createdTask[0].id);

		const task = await findTaskById(createdTask[0].id);
		expect(task).toBeUndefined();
	});

	it("should not create task without required fields", async () => {
		const user = await db
			.insert(users)
			.values({
				email: "test@example.com",
				passwordDigest: "password123",
				firstName: "Test",
				lastName: "User",
			})
			.returning();

		const status = await db
			.insert(taskStatuses)
			.values({
				name: "Draft",
			})
			.returning();

		const taskData = {
			name: "", // Empty name - should fail validation
			description: "Description",
			statusId: status[0].id,
			creatorId: user[0].id,
		};

		expect(async () => {
			await createTask(taskData);
		}).rejects.toThrow();
	});
});
