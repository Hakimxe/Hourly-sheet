import { NextResponse } from "next/server";
import { db, Creator } from "@/lib/db";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // 'active' | 'paused' | 'all'
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();
  const startedFrom = searchParams.get("startedFrom"); // YYYY-MM-DD
  const startedTo = searchParams.get("startedTo"); // YYYY-MM-DD
  const sort = searchParams.get("sort") ?? "newest"; // 'newest' | 'oldest' | 'name'

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (status && status !== "all") {
    where.push("status = ?");
    params.push(status);
  }
  if (search) {
    where.push("LOWER(name) LIKE ?");
    params.push(`%${search}%`);
  }
  if (startedFrom) {
    where.push("date(created_at) >= date(?)");
    params.push(startedFrom);
  }
  if (startedTo) {
    where.push("date(created_at) <= date(?)");
    params.push(startedTo);
  }

  const order =
    sort === "oldest"
      ? "created_at ASC"
      : sort === "name"
      ? "LOWER(name) ASC"
      : "created_at DESC";

  const sql = `SELECT * FROM creators ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY ${order}`;

  const creators = (await db.prepare(sql).all(...params)) as Creator[];

  const withStats = await Promise.all(
    creators.map(async (c) => {
      const stats = (await db
        .prepare(
          `SELECT COALESCE(SUM(hours), 0) as total_hours,
                  COALESCE(SUM(videos), 0) as total_videos,
                  COUNT(*) as days
           FROM entries
           WHERE creator_id = ?`
        )
        .get(c.id)) as { total_hours: number; total_videos: number; days: number };
      return { ...c, ...stats };
    })
  );

  return NextResponse.json(withStats);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || typeof body.country !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const name = body.name.trim();
  const country = body.country.trim();
  if (!name || !country) {
    return NextResponse.json(
      { error: "Name and country are required" },
      { status: 400 }
    );
  }

  const slug = nanoid(12);
  const result = await db
    .prepare(
      "INSERT INTO creators (name, country, slug, status) VALUES (?, ?, ?, 'active')"
    )
    .run(name, country, slug);
  const creator = (await db
    .prepare("SELECT * FROM creators WHERE id = ?")
    .get(result.lastInsertRowid)) as Creator;

  return NextResponse.json(creator, { status: 201 });
}
