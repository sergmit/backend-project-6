// @ts-check

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import reverseRoutes from "fastify-reverse-routes";
import appPlugin, { options as appOptions } from "../../server/index.js";

const rootDir = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
);

export const buildApp = async () => {
	fs.mkdirSync(path.join(rootDir, "dist"), { recursive: true });
	reverseRoutes.routes.clear();

	const app = Fastify({ ...appOptions });
	await app.register(appPlugin);
	await app.ready();
	return app;
};
