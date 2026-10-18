setup: prepare install db-migrate

install:
	npm ci

db-migrate:
	node scripts/db-migrate.js

db-generate:
	npx drizzle-kit generate

build:
	npm run build

prepare:
	cp -n .env.example .env || true

start:
	heroku local -f Procfile.dev

start-backend:
	npm start -- --watch --verbose-watch --ignore-watch='node_modules .git'

start-frontend:
	npx webpack --watch --progress

lint:
	npx biome ci .

test:
	npm test -s

docker-up:
	docker compose up --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-clean:
	docker compose down -v
