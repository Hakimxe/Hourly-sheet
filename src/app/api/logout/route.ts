import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Returns 401 unconditionally so the browser drops the cached
// Basic Auth credentials for the realm.
export async function GET() {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signed out</title>
  <meta http-equiv="refresh" content="2;url=/manager">
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #fff7ed; color: #1e293b; display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; }
    h1 { color: #ea580c; font-size: 1.5rem; margin: 0 0 8px; }
    p { color: #64748b; font-size: 0.875rem; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Signed out</h1>
    <p>Redirecting to the sign-in prompt...</p>
  </div>
</body>
</html>`,
    {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "WWW-Authenticate":
          'Basic realm="CreatorHours Manager - Signed out", charset="UTF-8"',
      },
    }
  );
}
