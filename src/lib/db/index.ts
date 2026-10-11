import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const isVercel = !!process.env.VERCEL;
const DATA_DIR = process.env.DATA_DIR || (isVercel ? '/tmp' : process.cwd());
const dbDir = path.join(DATA_DIR, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(path.join(dbDir, 'db.sqlite'));
const db = drizzle(sqlite, {
  schema: schema,
});

export default db;
