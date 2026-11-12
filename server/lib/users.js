// @ts-check

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import encrypt from "./secure.cjs";

export const findUserByEmail = (email) =>
	db.query.users.findFirst({ where: eq(users.email, email) });

export const findUserById = (id) =>
	db.query.users.findFirst({ where: eq(users.id, id) });

export const findUsers = () =>
	db.query.users.findMany({ orderBy: (users, { asc }) => [asc(users.id)] });

export const verifyPassword = (user, password) =>
	user.passwordDigest === encrypt(password);

export const createUser = async ({ email, password, firstName, lastName }) => {
	const [user] = await db
		.insert(users)
		.values({ email, passwordDigest: encrypt(password), firstName, lastName })
		.returning();
	return user;
};

export const updateUser = async (id, { email, firstName, lastName }) => {
	const [user] = await db
		.update(users)
		.set({ email, firstName, lastName })
		.where(eq(users.id, id))
		.returning();
	return user;
};

export const deleteUser = async (id) => {
	const [user] = await db.delete(users).where(eq(users.id, id)).returning();
	return user;
};
