import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// On Railway/production: set DATA_DIR=/data (the mounted persistent volume).
// On local dev: defaults to ./data inside the project.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "app.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      videos INTEGER NOT NULL DEFAULT 0,
      locked INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(creator_id, date),
      FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_entries_creator_date ON entries(creator_id, date);
  `);

  // Idempotent migration: add `status` to creators if not present
  try {
    const cols = db.prepare("PRAGMA table_info(creators)").all() as { name: string }[];
    if (!cols.some((c) => c.name === "status")) {
      db.exec("ALTER TABLE creators ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
    }
  } catch {
    // ignore
  }

  return db;
}

export const db: Database.Database = global.__db ?? createDb();
if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}

export type Creator = {
  id: number;
  name: string;
  country: string;
  slug: string;
  status: "active" | "paused";
  created_at: string;
};

export type Entry = {
  id: number;
  creator_id: number;
  date: string;
  hours: number;
  videos: number;
  locked: number;
  created_at: string;
  updated_at: string;
};
