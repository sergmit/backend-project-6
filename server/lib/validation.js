// @ts-check

import * as yup from "yup";

/**
 * @typedef {{ message: string }[]} FieldErrors
 * @typedef {Record<string, FieldErrors>} FormErrors
 */

/**
 * @template T
 * @param {yup.Schema<T>} schema
 * @param {unknown} data
 * @returns {Promise<{ value: T | null, errors: FormErrors | null }>}
 */
export const validate = async (schema, data) => {
	try {
		const value = await schema.validate(data, {
			abortEarly: false,
			stripUnknown: true,
		});
		return { value, errors: null };
	} catch (err) {
		if (err instanceof yup.ValidationError) {
			/** @type {FormErrors} */
			const errors = {};
			for (const issue of err.inner) {
				const path = issue.path || "_";
				if (!errors[path]) {
					errors[path] = [];
				}
				errors[path].push({ message: issue.message });
			}
			return { value: null, errors };
		}
		throw err;
	}
};

export const registrationSchema = yup.object({
	email: yup
		.string()
		.trim()
		.required("Email is required")
		.email("Invalid email"),
	password: yup.string().required("Password is required"),
	firstName: yup.string().trim().nullable().notRequired(),
	lastName: yup.string().trim().nullable().notRequired(),
});

export const updateUserSchema = yup.object({
	email: yup
		.string()
		.trim()
		.required("Email is required")
		.email("Invalid email"),
	firstName: yup.string().trim().nullable().notRequired(),
	lastName: yup.string().trim().nullable().notRequired(),
});

export const taskStatusSchema = yup.object({
	name: yup
		.string()
		.trim()
		.required("Name is required")
		.min(1, "Name must be at least 1 character"),
});

export const labelSchema = yup.object({
	name: yup
		.string()
		.trim()
		.required("Name is required")
		.min(1, "Name must be at least 1 character"),
});

export const taskSchema = yup.object({
	name: yup
		.string()
		.trim()
		.required("Name is required")
		.min(1, "Name must be at least 1 character"),
	description: yup.string().nullable().notRequired(),
	statusId: yup.number().required("Status is required"),
	executorId: yup
		.number()
		.nullable()
		.transform((value, originalValue) => (originalValue === "" ? null : value))
		.notRequired(),
	labelIds: yup
		.array()
		.of(yup.number().integer().positive())
		.transform((_value, originalValue) =>
			originalValue === undefined ||
			originalValue === null ||
			originalValue === ""
				? []
				: Array.isArray(originalValue)
					? originalValue
					: [originalValue],
		)
		.default([]),
});
