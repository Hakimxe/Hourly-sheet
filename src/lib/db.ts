import { createClient, type Client, type InValue } from "@libsql/client";

// On Vercel / production: set TURSO_DATABASE_URL=libsql://... and TURSO_AUTH_TOKEN=...
// On local dev: defaults to a file-backed SQLite db at ./data/app.db
//   (libsql supports file: URLs natively, so no extra setup needed).
const url =
  process.env.TURSO_DATABASE_URL ?? "file:./data/app.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

declare global {
  // eslint-disable-next-line no-var
  var __client: Client | undefined;
  // eslint-disable-next-line no-var
  var __dbInitDone: boolean | undefined;
}

const client: Client =
  global.__client ??
  createClient({
    url,
    ...(authToken ? { authToken } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  global.__client = client;
}

// ---------------------------------------------------------------------------
// Schema bootstrap (idempotent). Run once per process.
// ---------------------------------------------------------------------------
async function ensureSchema(): Promise<void> {
  if (global.__dbInitDone) return;

  // Note: libsql/Turso doesn't support multi-statement exec well via executeMultiple
  // for our needs; we use individual statements.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
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
    )
  `);

  await client.execute(
    `CREATE INDEX IF NOT EXISTS idx_entries_creator_date ON entries(creator_id, date)`
  );

  // Idempotent migration: ensure 'status' column on creators
  try {
    const cols = await client.execute(`PRAGMA table_info(creators)`);
    const hasStatus = cols.rows.some((r) => (r.name as string) === "status");
    if (!hasStatus) {
      await client.execute(
        `ALTER TABLE creators ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`
      );
    }
  } catch {
    // ignore
  }

  global.__dbInitDone = true;
}

// ---------------------------------------------------------------------------
// Compatibility shim so existing route code keeps the
//    db.prepare(sql).all(...args) / .get(...args) / .run(...args)
// API surface from better-sqlite3.  All methods are async now.
// ---------------------------------------------------------------------------
type Args = (string | number | bigint | null | Uint8Array)[];

function toInValues(args: Args): InValue[] {
  return args.map((a) => a as InValue);
}

export interface PreparedStatement<R = Record<string, unknown>> {
  all: (...args: Args) => Promise<R[]>;
  get: (...args: Args) => Promise<R | undefined>;
  run: (...args: Args) => Promise<{ lastInsertRowid: number; changes: number }>;
}

function prepare<R = Record<string, unknown>>(sql: string): PreparedStatement<R> {
  return {
    async all(...args: Args) {
      await ensureSchema();
      const res = await client.execute({ sql, args: toInValues(args) });
      return res.rows as unknown as R[];
    },
    async get(...args: Args) {
      await ensureSchema();
      const res = await client.execute({ sql, args: toInValues(args) });
      return (res.rows[0] as unknown as R) ?? undefined;
    },
    async run(...args: Args) {
      await ensureSchema();
      const res = await client.execute({ sql, args: toInValues(args) });
      return {
        lastInsertRowid: Number(res.lastInsertRowid ?? 0),
        changes: res.rowsAffected,
      };
    },
  };
}

export const db = {
  prepare,
  raw: client,
};

// ---------------------------------------------------------------------------
// Types — unchanged from original
// ---------------------------------------------------------------------------
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
