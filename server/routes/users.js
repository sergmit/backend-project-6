// @ts-check

import i18next from "i18next";
import _ from "lodash";
import {
	createUser,
	deleteUser,
	findUserByEmail,
	findUserById,
	findUsers,
	updateUser,
} from "../lib/users.js";
import {
	registrationSchema,
	updateUserSchema,
	validate,
} from "../lib/validation.js";

const pickUserData = (body) => ({
	email: _.get(body, "data.email", ""),
	password: _.get(body, "data.password", ""),
	firstName: _.get(body, "data.firstName", null),
	lastName: _.get(body, "data.lastName", null),
});

const pickUserUpdateData = (body) => ({
	email: _.get(body, "data.email", ""),
	firstName: _.get(body, "data.firstName", null),
	lastName: _.get(body, "data.lastName", null),
});

const parseId = (raw) => {
	const id = Number.parseInt(raw, 10);
	return Number.isNaN(id) ? null : id;
};

export default (app) => {
	app
		.get("/users/new", { name: "newUser" }, (_req, reply) => {
			reply.render("users/new", { entity: {}, errors: {} });
		})
		.post("/users", { name: "createUser" }, async (req, reply) => {
			const entity = pickUserData(req.body);
			const { value, errors } = await validate(registrationSchema, entity);

			let formErrors = errors;
			if (!formErrors && value) {
				const existingUser = await findUserByEmail(value.email);
				if (existingUser) {
					formErrors = {
						email: [{ message: i18next.t("validation.emailTaken") }],
					};
				}
			}

			if (formErrors || !value) {
				reply.code(422);
				await reply.render("users/new", { entity, errors: formErrors ?? {} });
				return;
			}

			try {
				await createUser(value);
			} catch (err) {
				if (err?.code === "23505") {
					reply.code(422);
					await reply.render("users/new", {
						entity,
						errors: {
							email: [{ message: i18next.t("validation.emailTaken") }],
						},
					});
					return;
				}
				throw err;
			}

			req.flash("success", i18next.t("flash.users.create.success"));
			reply.redirect(app.reverse("newSession"));
		})
		.get("/users", { name: "users" }, async (_req, reply) => {
			const users = await findUsers();
			await reply.render("users/index", { users });
		})
		.delete(
			"/users/:id",
			{ name: "deleteUser", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const user = id === null ? null : await findUserById(id);

				if (!user) {
					await reply.callNotFound();
					return;
				}

				await deleteUser(id);
				req.flash("success", i18next.t("flash.users.delete.success"));

				if (req.user?.id === id) {
					await req.logout();
					reply.redirect(app.reverse("root"));
					return;
				}

				reply.redirect(app.reverse("users"));
			},
		)
		.get(
			"/users/:id",
			{ name: "showUser", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const user = id === null ? null : await findUserById(id);

				if (!user) {
					reply.callNotFound();
					return;
				}

				if (req.user?.id !== user.id) {
					req.flash("error", i18next.t("flash.authError"));
					reply.redirect(app.reverse("root"));
					return;
				}

				await reply.render("users/show", { user });
			},
		)
		.get(
			"/users/:id/edit",
			{ name: "editUser", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const user = id === null ? null : await findUserById(id);

				if (!user) {
					reply.callNotFound();
					return;
				}

				if (req.user?.id !== user.id) {
					req.flash("error", i18next.t("flash.authError"));
					reply.redirect(app.reverse("root"));
					return;
				}

				await reply.render("users/edit", { entity: user, errors: {} });
			},
		)
		.patch(
			"/users/:id",
			{ name: "updateUser", preHandler: app.authenticate },
			async (req, reply) => {
				const id = parseId(req.params.id);
				const user = id === null ? null : await findUserById(id);

				if (!user) {
					reply.callNotFound();
					return;
				}

				if (req.user?.id !== user.id) {
					req.flash("error", i18next.t("flash.authError"));
					reply.redirect(app.reverse("root"));
					return;
				}

				const entity = pickUserUpdateData(req.body);
				const { value, errors } = await validate(updateUserSchema, entity);

				let formErrors = errors;
				if (!formErrors && value) {
					const existingUser = await findUserByEmail(value.email);
					if (existingUser && existingUser.id !== id) {
						formErrors = {
							email: [{ message: i18next.t("validation.emailTaken") }],
						};
					}
				}

				if (formErrors || !value) {
					reply.code(422);
					await reply.render("users/edit", {
						entity: { ...user, ...entity },
						errors: formErrors ?? {},
					});
					return;
				}

				try {
					await updateUser(id, value);
				} catch (err) {
					if (err?.code === "23505") {
						reply.code(422);
						await reply.render("users/edit", {
							entity: { ...user, ...entity },
							errors: {
								email: [{ message: i18next.t("validation.emailTaken") }],
							},
						});
						return;
					}
					throw err;
				}

				req.flash("success", i18next.t("flash.users.update.success"));
				reply.redirect(app.reverse("showUser", { id }));
			},
		);
};
