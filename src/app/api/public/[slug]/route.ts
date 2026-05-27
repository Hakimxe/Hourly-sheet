import { NextResponse } from "next/server";
import { db, Creator, Entry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const creator = (await db
    .prepare(
      "SELECT id, name, country, slug, status, created_at FROM creators WHERE slug = ?"
    )
    .get(params.slug)) as Creator | undefined;
  if (!creator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let entries: Entry[];
  if (month) {
    entries = (await db
      .prepare(
        "SELECT * FROM entries WHERE creator_id = ? AND date LIKE ? ORDER BY date ASC"
      )
      .all(creator.id, `${month}%`)) as Entry[];
  } else {
    entries = (await db
      .prepare("SELECT * FROM entries WHERE creator_id = ? ORDER BY date ASC")
      .all(creator.id)) as Entry[];
  }

  return NextResponse.json({ creator, entries });
}
