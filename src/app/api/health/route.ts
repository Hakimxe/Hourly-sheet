import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Public health-check endpoint for Railway / uptime monitors.
// Returns 200 + "ok" — no auth required, no DB access.
export async function GET() {
  return new NextResponse("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
