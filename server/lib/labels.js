// @ts-check

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { labels } from "../db/schema.js";

export const findLabels = () =>
	db.query.labels.findMany({
		orderBy: (labels, { asc }) => [asc(labels.id)],
	});

export const findLabelById = (id) =>
	db.query.labels.findFirst({ where: eq(labels.id, id) });

export const createLabel = async ({ name }) => {
	const [label] = await db.insert(labels).values({ name }).returning();
	return label;
};

export const updateLabel = async (id, { name }) => {
	const [label] = await db
		.update(labels)
		.set({ name })
		.where(eq(labels.id, id))
		.returning();
	return label;
};

export const deleteLabel = async (id) => {
	const [label] = await db.delete(labels).where(eq(labels.id, id)).returning();
	return label;
};
