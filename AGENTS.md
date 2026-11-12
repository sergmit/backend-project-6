# AGENTS.md

## Project

Hexlet learning project (task manager): Fastify 5 + Drizzle ORM (PostgreSQL) + Eta templates; frontend assets via Vite + Tailwind v4 (+ Bootstrap CSS). Plain JS ESM (`"type": "module"`), Node 22, `// @ts-check` JSDoc — no TypeScript, no typecheck command.

## Commands

- `make setup` — first-time setup: `.env.example` → `.env`, `npm ci`, apply migrations (migrations are skipped with exit 0 if Postgres is down)
- `make docker-up` — full dev stack: Postgres + node (watch mode) + nginx at http://localhost:8080; also `docker-down` / `docker-logs` / `docker-clean` (`-v` wipes the DB volume)
- `npm run lint` — `biome ci .`; there is **no biome.json**, so Biome defaults apply (tabs). The codebase currently fails lint with hundreds of pre-existing errors (mostly indentation) — not a reliable green gate
- `npm run lint:fix` — `biome check --write .`; would reformat the whole repo to Biome defaults — don't run wholesale unless asked
- `npm test` — Jest (`--runInBand`), tests match `__tests__/**/*.js`. `__tests__/` is empty right now, so it exits 1 with "No tests found" — expected until Hexlet tests land. Single test: `npx jest __tests__/some.test.js`
- `npm run build` — Vite bundles `assets/js/main.js` + `assets/css/source.css` into `dist/` as `main.js` / `main.css`; `prebuild` wipes `dist/` first
- `make db-generate` — generate SQL migration in `drizzle/` after editing `server/db/schema.js`
- `make db-migrate` — apply migrations via `scripts/db-migrate.js`
- `npm start` — run server via fastify-cli: `fastify start server/index.js`

Avoid Makefile `start` / `start-backend` / `start-frontend` — stale (reference a nonexistent `Procfile.dev` and webpack; Vite is the real frontend build).

## Architecture

- `server/index.js` — Fastify app factory (default-export plugin, loaded by fastify-cli). Registers: passport form strategy (`server/lib/passportStrategies/`), secure-session (requires `SESSION_KEY`), i18next (lng `en`, fallback `ru`; strings in `server/locales/`), Eta views (`server/views/`, layout `layouts/application.eta`), static files from `dist/` under `/assets/`
- `server/routes/index.js` — add each new route module to the `controllers` array; named routes via fastify-reverse-routes (`app.reverse('name')`, exposed to templates as `route(name)`)
- `routes.md` — registry of all HTTP routes. Whenever routes in `server/routes/` are added, changed, or removed, update `routes.md` accordingly
- Templates receive helpers from `server/helpers/index.js` in the Eta default context; render with `reply.render('view/path', locals)`
- `server/db/` — Drizzle client (pg Pool) in `index.js`, schema in `schema.js` (`users`, `task_statuses`, `tasks`). Env loaded via `process.loadEnvFile()` in try/catch — inside Docker, compose env vars win over `.env`
- `server/lib/secure.cjs` — deliberate CJS island (`.cjs` in an ESM package); passwords are plain SHA-256 hex (curriculum requirement)
- `docker/node/entrypoint.sh` — container boot: waits for Postgres, re-runs `npm ci` if `package-lock.json` hash changed, applies migrations, `vite build` + watch, then fastify in watch mode

## Environment

- `.env` (copy of `.env.example`): `SESSION_KEY` (long hex, cookie encryption) + `DATABASE_HOST/PORT/NAME/USER/PASSWORD`; defaults point at local Postgres `postgres/postgres@localhost:5432/app_development`
- `.npmrc` sets `legacy-peer-deps=true` — keep it, `npm ci` depends on it

## Constraints

- Never delete, edit, or rename `.github/workflows/hexlet-check.yml`, and don't rename the repo — Hexlet auto-tests depend on it (stated in README and the workflow header)
- Don't hand-edit applied migrations in `drizzle/`; change `server/db/schema.js` and run `make db-generate`
