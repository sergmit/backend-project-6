// @ts-check

import i18next from "i18next";
import _ from "lodash";
import {
	createStatus,
	deleteStatus,
	findStatusById,
	findStatuses,
	updateStatus,
} from "../lib/statuses.js";
import { taskStatusSchema, validate } from "../lib/validation.js";

const pickStatusData = (body) => ({
	name: _.get(body, "data.name", ""),
});

const parseId = (raw) => {
	const id = Number.parseInt(raw, 10);
	return Number.isNaN(id) ? null : id;
};

export default (app) => {
	app
		.get(
			"/statuses",
			{ name: "statuses", preHandler: app.authenticate },
			async (_req, reply) => {
				const statuses = await findStatuses();
				await reply.render("statuses/index", { statuses });
			},
		)
		.get(
			"/statuses/new",
			{ name: "newStatus", preHandler: app.authenticate },
			(_req, reply) => {
				reply.render("statuses/new", { entity: {}, errors: {} });
			},
		)
		.post(
			"/statuses",
			{ name: "createStatus", preHandler: app.authenticate },
			async (req, reply) => {
				const entity = pickStatusData(req.body);
				const { value, errors } = await validate(taskStatusSchema, entity);

				if (errors || !value) {
					reply.code(422);
					await reply.render("statuses/new", { entity, errors: errors ?? {} });
					return;
				}

				await createStatus(value);
				req.flash("success", i18next.t("flash.statuses.create.success"));
				reply.redirect(app.reverse("statuses"));
			},
		)
		.get(
			"/statuses/:id/edit",
			{ name: "editStatus", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const status = id === null ? null : await findStatusById(id);

				if (!status) {
					await reply.callNotFound();
					return;
				}

				await reply.render("statuses/edit", { entity: status, errors: {} });
			},
		)
		.patch(
			"/statuses/:id",
			{ name: "updateStatus", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const status = id === null ? null : await findStatusById(id);

				if (!status) {
					await reply.callNotFound();
					return;
				}

				const entity = pickStatusData(req.body);
				const { value, errors } = await validate(taskStatusSchema, entity);

				if (errors || !value) {
					reply.code(422);
					await reply.render("statuses/edit", {
						entity: { ...status, ...entity },
						errors: errors ?? {},
					});
					return;
				}

				await updateStatus(id, value);
				req.flash("success", i18next.t("flash.statuses.update.success"));
				reply.redirect(app.reverse("statuses"));
			},
		)
		.delete(
			"/statuses/:id",
			{ name: "deleteStatus", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const status = id === null ? null : await findStatusById(id);

				if (!status) {
					await reply.callNotFound();
					return;
				}

				await deleteStatus(id);
				req.flash("success", i18next.t("flash.statuses.delete.success"));
				reply.redirect(app.reverse("statuses"));
			},
		);
};
