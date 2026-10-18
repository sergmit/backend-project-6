#!/bin/sh
set -e

echo "Waiting for postgres at ${DATABASE_HOST:-db}:${DATABASE_PORT:-5432}..."
node -e '
const net = require("node:net");
const host = process.env.DATABASE_HOST || "db";
const port = Number(process.env.DATABASE_PORT || 5432);
const probe = () => {
  const socket = net.connect({ host, port }, () => {
    socket.end();
    process.exit(0);
  });
  socket.on("error", () => setTimeout(probe, 1000));
};
probe();
'

LOCK_HASH="$(md5sum package-lock.json | cut -d' ' -f1)"
if [ ! -f node_modules/.lock-hash ] || [ "$(cat node_modules/.lock-hash)" != "$LOCK_HASH" ]; then
  echo "package-lock.json changed, running npm ci..."
  npm ci
  echo "$LOCK_HASH" > node_modules/.lock-hash
fi

echo "Running migrations..."
node scripts/db-migrate.js

# vite сам очищает содержимое dist, не удаляя каталог (иначе сломается bind mount nginx)
echo "Building frontend..."
npx vite build

echo "Starting frontend watcher and fastify (watch mode)..."
npx vite build --watch &
exec npx fastify start server/index.js -l debug -P --options -w --verbose-watch
