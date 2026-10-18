// @ts-check

import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../server/db/index.js';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const host = process.env.DATABASE_HOST ?? 'localhost';
const port = Number(process.env.DATABASE_PORT ?? 5432);

const reachable = await new Promise((resolve) => {
  const socket = net.connect({ host, port });
  socket.setTimeout(3000);
  socket.on('connect', () => {
    socket.end();
    resolve(true);
  });
  socket.on('error', () => resolve(false));
  socket.on('timeout', () => {
    socket.destroy();
    resolve(false);
  });
});

if (!reachable) {
  console.warn(`Postgres at ${host}:${port} is not reachable, skipping migrations`);
  process.exit(0);
}

try {
  await migrate(db, { migrationsFolder: path.join(rootDir, 'drizzle') });
  console.log('Migrations applied');
} finally {
  await db.$client.end();
}
