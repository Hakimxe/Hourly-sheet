import { NextResponse } from "next/server";
import { db, Entry } from "@/lib/db";

export const dynamic = "force-dynamic";

// Manager-only edit (bypasses lock when manager=1)
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

  const entry = (await db
    .prepare("SELECT * FROM entries WHERE id = ?")
    .get(id)) as Entry | undefined;
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (body.hours != null) {
    const h = Number(body.hours);
    if (!Number.isFinite(h) || h < 0 || h > 24) {
      return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
    }
    fields.push("hours = ?");
    values.push(h);
  }
  if (body.videos != null) {
    const v = Number(body.videos);
    if (!Number.isInteger(v) || v < 0) {
      return NextResponse.json({ error: "Invalid videos" }, { status: 400 });
    }
    fields.push("videos = ?");
    values.push(v);
  }
  if (body.locked != null) {
    fields.push("locked = ?");
    values.push(body.locked ? 1 : 0);
  }
  if (!fields.length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await db
    .prepare(`UPDATE entries SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
  const updated = (await db
    .prepare("SELECT * FROM entries WHERE id = ?")
    .get(id)) as Entry;
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
