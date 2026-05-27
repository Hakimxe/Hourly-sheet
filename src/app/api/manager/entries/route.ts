import { NextResponse } from "next/server";
import { db, Entry } from "@/lib/db";

export const dynamic = "force-dynamic";

// Manager-side entry creation (can set locked flag explicitly,
// bypasses lock check)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { creator_id, date, hours, videos, locked } = body as {
    creator_id?: number;
    date?: string;
    hours?: number;
    videos?: number;
    locked?: number;
  };

  if (!creator_id || !date || hours == null || videos == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }
  const h = Number(hours);
  const v = Number(videos);
  if (!Number.isFinite(h) || h < 0 || h > 24) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }
  if (!Number.isInteger(v) || v < 0) {
    return NextResponse.json({ error: "Invalid videos" }, { status: 400 });
  }
  const lockedVal = locked ? 1 : 0;

  const existing = (await db
    .prepare("SELECT * FROM entries WHERE creator_id = ? AND date = ?")
    .get(creator_id, date)) as Entry | undefined;

  if (existing) {
    await db
      .prepare(
        "UPDATE entries SET hours = ?, videos = ?, locked = ?, updated_at = datetime('now') WHERE id = ?"
      )
      .run(h, v, lockedVal, existing.id);
    const updated = (await db
      .prepare("SELECT * FROM entries WHERE id = ?")
      .get(existing.id)) as Entry;
    return NextResponse.json(updated);
  }

  const result = await db
    .prepare(
      "INSERT INTO entries (creator_id, date, hours, videos, locked) VALUES (?, ?, ?, ?, ?)"
    )
    .run(creator_id, date, h, v, lockedVal);
  const created = (await db
    .prepare("SELECT * FROM entries WHERE id = ?")
    .get(result.lastInsertRowid)) as Entry;
  return NextResponse.json(created, { status: 201 });
}
