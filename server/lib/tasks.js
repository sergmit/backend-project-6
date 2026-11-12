// @ts-check

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { taskLabels, tasks } from "../db/schema.js";

const normalizeTaskData = (data) => {
	const values = { ...data };
	if (values.executorId === "") {
		values.executorId = null;
	}
	if (values.executorId === undefined) {
		delete values.executorId;
	}
	return values;
};

const assertName = (name) => {
	if (typeof name !== "string" || name.trim() === "") {
		throw new Error("Name is required");
	}
};

const splitLabels = (data) => {
	const { labelIds = [], ...taskData } = data;
	return {
		taskData: normalizeTaskData(taskData),
		labelIds: [...new Set(labelIds)],
	};
};

const insertTaskLabels = async (client, taskId, labelIds) => {
	if (labelIds.length === 0) {
		return;
	}

	await client
		.insert(taskLabels)
		.values(labelIds.map((labelId) => ({ taskId, labelId })));
};

export const findTasks = async () => {
	return await db.query.tasks.findMany({
		orderBy: (tasks, { asc }) => [asc(tasks.createdAt), asc(tasks.id)],
		with: {
			status: true,
			creator: true,
			executor: true,
			taskLabels: { with: { label: true } },
		},
	});
};

export const findTaskById = async (id) => {
	return await db.query.tasks.findFirst({
		where: (tasks, { eq }) => eq(tasks.id, id),
		with: {
			status: true,
			creator: true,
			executor: true,
			taskLabels: { with: { label: true } },
		},
	});
};

export const createTask = async (data) => {
	assertName(data.name);

	const { taskData, labelIds } = splitLabels(data);

	return await db.transaction(async (tx) => {
		const [task] = await tx.insert(tasks).values(taskData).returning();
		await insertTaskLabels(tx, task.id, labelIds);
		return task;
	});
};

export const updateTask = async (id, data) => {
	assertName(data.name);

	const { taskData, labelIds } = splitLabels(data);

	return await db.transaction(async (tx) => {
		const [task] = await tx
			.update(tasks)
			.set({ ...taskData, updatedAt: new Date() })
			.where(eq(tasks.id, id))
			.returning();

		await tx.delete(taskLabels).where(eq(taskLabels.taskId, id));
		await insertTaskLabels(tx, id, labelIds);

		return task;
	});
};

export const deleteTask = async (id) => {
	await db.delete(tasks).where(eq(tasks.id, id));
};
