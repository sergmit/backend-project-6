// @ts-check

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { testEnv } from './helpers/env.js';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default async () => {
    const adminPool = new pg.Pool({
        host: testEnv.DATABASE_HOST,
        port: Number(testEnv.DATABASE_PORT),
        user: testEnv.DATABASE_USER,
        password: testEnv.DATABASE_PASSWORD,
        database: 'postgres',
    });

    try {
        const result = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [
            testEnv.DATABASE_NAME,
        ]);
        if (result.rowCount === 0) {
            await adminPool.query(`CREATE DATABASE "${testEnv.DATABASE_NAME}"`);
        }
    } finally {
        await adminPool.end();
    }

    const migrate = spawnSync('node', ['scripts/db-migrate.js'], {
        cwd: rootDir,
        env: { ...process.env, ...testEnv },
        stdio: 'inherit',
    });

    if (migrate.status !== 0) {
        throw new Error(`Migrations failed with status ${migrate.status}`);
    }
};
