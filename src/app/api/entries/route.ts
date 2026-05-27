import { NextResponse } from "next/server";
import { db, Entry } from "@/lib/db";

export const dynamic = "force-dynamic";

// Create a new entry (creator side – auto-locks)
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { slug, date, hours, videos } = body as {
    slug?: string;
    date?: string;
    hours?: number;
    videos?: number;
  };

  if (!slug || !date || hours == null || videos == null) {
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

  const creator = db
    .prepare("SELECT id, status FROM creators WHERE slug = ?")
    .get(slug) as { id: number; status: string } | undefined;
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }
  if (creator.status === "paused") {
    return NextResponse.json(
      {
        error:
          "This account is paused. Please contact your manager to reactivate.",
      },
      { status: 403 }
    );
  }

  // No future dates allowed
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const entryDate = new Date(date + "T00:00:00");
  if (entryDate.getTime() > today.getTime()) {
    return NextResponse.json(
      { error: "Cannot submit for a future date" },
      { status: 400 }
    );
  }

  // If already exists & locked, refuse
  const existing = db
    .prepare(
      "SELECT * FROM entries WHERE creator_id = ? AND date = ?"
    )
    .get(creator.id, date) as Entry | undefined;
  if (existing && existing.locked) {
    return NextResponse.json(
      { error: "This entry is locked. Contact your manager to modify it." },
      { status: 403 }
    );
  }

  if (existing) {
    db.prepare(
      "UPDATE entries SET hours = ?, videos = ?, locked = 1, updated_at = datetime('now') WHERE id = ?"
    ).run(h, v, existing.id);
    const updated = db
      .prepare("SELECT * FROM entries WHERE id = ?")
      .get(existing.id) as Entry;
    return NextResponse.json(updated);
  }

  const result = db
    .prepare(
      "INSERT INTO entries (creator_id, date, hours, videos, locked) VALUES (?, ?, ?, ?, 1)"
    )
    .run(creator.id, date, h, v);
  const created = db
    .prepare("SELECT * FROM entries WHERE id = ?")
    .get(result.lastInsertRowid) as Entry;

  return NextResponse.json(created, { status: 201 });
}
