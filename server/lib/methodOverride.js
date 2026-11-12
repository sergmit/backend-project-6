// @ts-check

const SKIP_OVERRIDE = Symbol.for("skip-override");

const overridableMethods = new Set([
	"HEAD",
	"PUT",
	"DELETE",
	"OPTIONS",
	"PATCH",
]);

const notFound = (message) =>
	Object.assign(new Error(message), { statusCode: 404 });

const toArray = (value) => {
	if (value === undefined || value === null) {
		return [];
	}
	return Array.isArray(value) ? value : [value];
};

const escapeSegment = (segment) =>
	segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildMatcher = (url) => {
	const names = [];
	let hasWildcard = false;

	const source = url
		.split("/")
		.map((segment) => {
			if (segment.startsWith(":")) {
				names.push(segment.slice(1));
				return "([^/]+)";
			}
			if (segment === "*") {
				hasWildcard = true;
				return "(.*)";
			}
			return escapeSegment(segment);
		})
		.join("/");

	const pattern = new RegExp(`^${source}/?$`);

	return (pathname) => {
		const found = pattern.exec(pathname);
		if (found === null) {
			return null;
		}

		const params = Object.fromEntries(
			names.map((name, index) => [name, decodeURIComponent(found[index + 1])]),
		);

		if (hasWildcard) {
			params["*"] = decodeURIComponent(found[names.length + 1]);
		}

		return params;
	};
};

const runHook = (hook, request, reply) =>
	new Promise((resolve, reject) => {
		const result = hook(request, reply, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve();
			}
		});

		if (typeof result?.then === "function") {
			result.then(() => resolve(), reject);
		}
	});

const methodOverride = async (fastify) => {
	const routesByMethod = new Map();

	const override = async (request, reply) => {
		if (request.raw.method.toUpperCase() !== "POST") {
			return;
		}

		const method = String(request.body?._method ?? "").toUpperCase();
		if (!overridableMethods.has(method)) {
			return;
		}

		const url = request.raw.url;
		const routes = routesByMethod.get(method) ?? [];
		const found = routes
			.map((route) => ({ route, params: route.match(url) }))
			.find(({ params }) => params !== null);

		reply.context = {
			...reply.context,
			config: { ...found?.route.config, ...reply.context?.config, method },
		};

		if (found === undefined) {
			throw notFound(`Route ${method}:${url} not found`);
		}

		request.params = found.params;
		request.raw.method = method;

		for (const hook of found.route.hooks) {
			await runHook(hook, request, reply);
			if (reply.sent) {
				return;
			}
		}

		await found.route.handler(request, reply);
	};

	fastify.addHook("onRoute", (routeOptions) => {
		const methods = toArray(routeOptions.method).map((method) =>
			method.toUpperCase(),
		);

		const overridable = methods.find((method) =>
			overridableMethods.has(method),
		);
		if (overridable !== undefined) {
			const routes = routesByMethod.get(overridable) ?? [];
			routes.push({
				match: buildMatcher(routeOptions.url),
				handler: routeOptions.handler,
				config: routeOptions.config,
				hooks: [
					...toArray(routeOptions.preValidation),
					...toArray(routeOptions.preHandler),
				],
			});
			routesByMethod.set(overridable, routes);
		}

		if (methods.includes("POST")) {
			routeOptions.preHandler = [override, ...toArray(routeOptions.preHandler)];
		}
	});

	fastify.setNotFoundHandler({ preHandler: override }, (request, reply) => {
		reply.code(404).send({
			statusCode: 404,
			error: "Not Found",
			message: `Route ${request.raw.method}:${request.raw.url} not found`,
		});
	});
};

methodOverride[SKIP_OVERRIDE] = true;

export default methodOverride;
