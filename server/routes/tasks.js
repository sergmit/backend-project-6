// @ts-check

import i18next from "i18next";
import { findLabels } from "../lib/labels.js";
import { findStatuses } from "../lib/statuses.js";
import {
	createTask,
	deleteTask,
	findTaskById,
	findTasks,
	updateTask,
} from "../lib/tasks.js";
import { findUsers } from "../lib/users.js";
import { taskSchema, validate } from "../lib/validation.js";

const parseId = (raw) => {
	const id = Number.parseInt(raw, 10);
	return Number.isNaN(id) ? null : id;
};

export default (app) => {
	const loadTask = async (id) => (id === null ? null : findTaskById(id));

	const renderForm = async (reply, view, entity, errors) => {
		const [taskStatuses, users, labels] = await Promise.all([
			findStatuses(),
			findUsers(),
			findLabels(),
		]);
		await reply.render(view, { entity, errors, taskStatuses, users, labels });
	};

	const getTasks = async (_req, reply) => {
		const tasks = await findTasks();
		await reply.render("tasks/index", { tasks });
	};

	const newTask = async (_req, reply) => {
		await renderForm(reply, "tasks/new", {}, {});
	};

	const createTaskHandler = async (req, reply) => {
		const formData = req.body.data || {};
		const { value, errors } = await validate(taskSchema, formData);

		if (errors || !value) {
			reply.code(422);
			await renderForm(reply, "tasks/new", formData, errors ?? {});
			return;
		}

		value.creatorId = req.user.id;

		await createTask(value);
		req.flash("success", i18next.t("flash.tasks.create.success"));
		reply.redirect(app.reverse("tasks"));
	};

	const showTask = async (req, reply) => {
		const task = await loadTask(parseId(req.params.id));

		if (!task) {
			await reply.callNotFound();
			return;
		}

		await reply.render("tasks/show", { task });
	};

	const editTask = async (req, reply) => {
		const task = await loadTask(parseId(req.params.id));

		if (!task) {
			await reply.callNotFound();
			return;
		}

		if (req.user?.id !== task.creatorId) {
			req.flash("error", i18next.t("flash.authError"));
			reply.redirect(app.reverse("tasks"));
			return;
		}

		const entity = {
			...task,
			labelIds: task.taskLabels.map(({ labelId }) => labelId),
		};
		await renderForm(reply, "tasks/edit", entity, {});
	};

	const updateTaskHandler = async (req, reply) => {
		const id = parseId(req.params.id);
		const task = await loadTask(id);

		if (!task || id === null) {
			await reply.callNotFound();
			return;
		}

		if (req.user?.id !== task.creatorId) {
			req.flash("error", i18next.t("flash.authError"));
			reply.redirect(app.reverse("tasks"));
			return;
		}

		const formData = req.body.data || {};
		const { value, errors } = await validate(taskSchema, formData);

		if (errors || !value) {
			reply.code(422);
			await renderForm(
				reply,
				"tasks/edit",
				{ ...task, ...formData },
				errors ?? {},
			);
			return;
		}

		await updateTask(id, value);
		req.flash("success", i18next.t("flash.tasks.update.success"));
		reply.redirect(app.reverse("tasks"));
	};

	const deleteTaskHandler = async (req, reply) => {
		const id = parseId(req.params.id);
		const task = await loadTask(id);

		if (!task || id === null) {
			await reply.callNotFound();
			return;
		}

		if (req.user?.id !== task.creatorId) {
			req.flash("error", i18next.t("flash.authError"));
			reply.redirect(app.reverse("tasks"));
			return;
		}

		await deleteTask(id);
		req.flash("success", i18next.t("flash.tasks.delete.success"));
		reply.redirect(app.reverse("tasks"));
	};

	app.get("/tasks", { name: "tasks", preHandler: app.authenticate }, getTasks);
	app.get(
		"/tasks/new",
		{ name: "newTask", preHandler: app.authenticate },
		newTask,
	);
	app.post(
		"/tasks",
		{ name: "createTask", preHandler: app.authenticate },
		createTaskHandler,
	);
	app.get(
		"/tasks/:id",
		{ name: "showTask", preHandler: app.authenticate },
		showTask,
	);
	app.get(
		"/tasks/:id/edit",
		{ name: "editTask", preHandler: app.authenticate },
		editTask,
	);
	app.patch(
		"/tasks/:id",
		{ name: "updateTask", preHandler: app.authenticate },
		updateTaskHandler,
	);
	app.delete(
		"/tasks/:id",
		{ name: "deleteTask", preHandler: app.authenticate },
		deleteTaskHandler,
	);
};
