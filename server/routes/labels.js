// @ts-check

import i18next from "i18next";
import _ from "lodash";
import {
	createLabel,
	deleteLabel,
	findLabelById,
	findLabels,
	updateLabel,
} from "../lib/labels.js";
import { labelSchema, validate } from "../lib/validation.js";

const pickLabelData = (body) => ({
	name: _.get(body, "data.name", ""),
});

const parseId = (raw) => {
	const id = Number.parseInt(raw, 10);
	return Number.isNaN(id) ? null : id;
};

export default (app) => {
	app
		.get(
			"/labels",
			{ name: "labels", preHandler: app.authenticate },
			async (_req, reply) => {
				const labels = await findLabels();
				await reply.render("labels/index", { labels });
			},
		)
		.get(
			"/labels/new",
			{ name: "newLabel", preHandler: app.authenticate },
			(_req, reply) => {
				reply.render("labels/new", { entity: {}, errors: {} });
			},
		)
		.post(
			"/labels",
			{ name: "createLabel", preHandler: app.authenticate },
			async (req, reply) => {
				const entity = pickLabelData(req.body);
				const { value, errors } = await validate(labelSchema, entity);

				if (errors || !value) {
					reply.code(422);
					await reply.render("labels/new", { entity, errors: errors ?? {} });
					return;
				}

				await createLabel(value);
				req.flash("success", i18next.t("flash.labels.create.success"));
				reply.redirect(app.reverse("labels"));
			},
		)
		.get(
			"/labels/:id/edit",
			{ name: "editLabel", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const label = id === null ? null : await findLabelById(id);

				if (!label) {
					await reply.callNotFound();
					return;
				}

				await reply.render("labels/edit", { entity: label, errors: {} });
			},
		)
		.patch(
			"/labels/:id",
			{ name: "updateLabel", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const label = id === null ? null : await findLabelById(id);

				if (!label) {
					await reply.callNotFound();
					return;
				}

				const entity = pickLabelData(req.body);
				const { value, errors } = await validate(labelSchema, entity);

				if (errors || !value) {
					reply.code(422);
					await reply.render("labels/edit", {
						entity: { ...label, ...entity },
						errors: errors ?? {},
					});
					return;
				}

				await updateLabel(id, value);
				req.flash("success", i18next.t("flash.labels.update.success"));
				reply.redirect(app.reverse("labels"));
			},
		)
		.delete(
			"/labels/:id",
			{ name: "deleteLabel", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const label = id === null ? null : await findLabelById(id);

				if (!label) {
					await reply.callNotFound();
					return;
				}

				await deleteLabel(id);
				req.flash("success", i18next.t("flash.labels.delete.success"));
				reply.redirect(app.reverse("labels"));
			},
		);
};
