// @ts-check

import { relations } from "drizzle-orm";
import {
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	passwordDigest: varchar("passwordDigest", { length: 255 }).notNull(),
	firstName: varchar("firstName", { length: 255 }),
	lastName: varchar("lastName", { length: 255 }),
});

export const taskStatuses = pgTable("task_statuses", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const labels = pgTable("labels", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	createdAt: timestamp("createdAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const tasks = pgTable("tasks", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	statusId: integer("statusId")
		.notNull()
		.references(() => taskStatuses.id),
	creatorId: integer("creatorId")
		.notNull()
		.references(() => users.id),
	executorId: integer("executorId").references(() => users.id),
	createdAt: timestamp("createdAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updatedAt", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const taskLabels = pgTable(
	"task_labels",
	{
		taskId: integer("taskId")
			.notNull()
			.references(() => tasks.id, { onDelete: "cascade" }),
		labelId: integer("labelId")
			.notNull()
			.references(() => labels.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.taskId, table.labelId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
	creatorTasks: many(tasks, { relationName: "creator" }),
	executorTasks: many(tasks, { relationName: "executor" }),
}));

export const labelsRelations = relations(labels, ({ many }) => ({
	taskLabels: many(taskLabels),
}));

export const taskLabelsRelations = relations(taskLabels, ({ one }) => ({
	task: one(tasks, {
		fields: [taskLabels.taskId],
		references: [tasks.id],
	}),
	label: one(labels, {
		fields: [taskLabels.labelId],
		references: [labels.id],
	}),
}));

export const taskStatusesRelations = relations(taskStatuses, ({ many }) => ({
	tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
	taskLabels: many(taskLabels),
	status: one(taskStatuses, {
		fields: [tasks.statusId],
		references: [taskStatuses.id],
	}),
	creator: one(users, {
		fields: [tasks.creatorId],
		references: [users.id],
		relationName: "creator",
	}),
	executor: one(users, {
		fields: [tasks.executorId],
		references: [users.id],
		relationName: "executor",
	}),
}));
