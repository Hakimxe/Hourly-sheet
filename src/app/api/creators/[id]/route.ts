import { NextResponse } from "next/server";
import { db, Creator, Entry } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const creator = (await db
    .prepare("SELECT * FROM creators WHERE id = ?")
    .get(id)) as Creator | undefined;
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM

  let entries: Entry[];
  if (month) {
    entries = (await db
      .prepare(
        "SELECT * FROM entries WHERE creator_id = ? AND date LIKE ? ORDER BY date ASC"
      )
      .all(id, `${month}%`)) as Entry[];
  } else {
    entries = (await db
      .prepare("SELECT * FROM entries WHERE creator_id = ? ORDER BY date ASC")
      .all(id)) as Entry[];
  }

  return NextResponse.json({ creator, entries });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (typeof body.name === "string" && body.name.trim()) {
    fields.push("name = ?");
    values.push(body.name.trim());
  }
  if (typeof body.country === "string" && body.country.trim()) {
    fields.push("country = ?");
    values.push(body.country.trim());
  }
  if (typeof body.status === "string") {
    const s = body.status.trim().toLowerCase();
    if (s !== "active" && s !== "paused") {
      return NextResponse.json(
        { error: "Invalid status (must be 'active' or 'paused')" },
        { status: 400 }
      );
    }
    fields.push("status = ?");
    values.push(s);
  }
  if (!fields.length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  values.push(id);
  await db
    .prepare(`UPDATE creators SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  const creator = (await db
    .prepare("SELECT * FROM creators WHERE id = ?")
    .get(id)) as Creator;
  return NextResponse.json(creator);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await db.prepare("DELETE FROM creators WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
