// @ts-check

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { taskStatuses } from "../db/schema.js";

export const findStatuses = () =>
	db.query.taskStatuses.findMany({
		orderBy: (taskStatuses, { asc }) => [asc(taskStatuses.id)],
	});

export const findStatusById = (id) =>
	db.query.taskStatuses.findFirst({ where: eq(taskStatuses.id, id) });

export const createStatus = async ({ name }) => {
	const [status] = await db.insert(taskStatuses).values({ name }).returning();
	return status;
};

export const updateStatus = async (id, { name }) => {
	const [status] = await db
		.update(taskStatuses)
		.set({ name })
		.where(eq(taskStatuses.id, id))
		.returning();
	return status;
};

export const deleteStatus = async (id) => {
	const [status] = await db
		.delete(taskStatuses)
		.where(eq(taskStatuses.id, id))
		.returning();
	return status;
};
