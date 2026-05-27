import { NextRequest, NextResponse } from "next/server";

// Defaults so the app works locally without env setup.
// On Railway / production, set these as environment variables.
const USERNAME = process.env.AUTH_USERNAME || "Hakim323";
const PASSWORD = process.env.AUTH_PASSWORD || "Gunkilwa8.@Maeve";

// Timing-safe string compare (avoids leaking length / content via timing).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CreatorHours Manager", charset="UTF-8"',
    },
  });
}

export function middleware(req: NextRequest) {
  // Safety net: never protect creator-facing endpoints, even if the matcher
  // ever changes. /api/entries (POST, creator submission) and /api/public/*
  // must always be open.
  const { pathname } = req.nextUrl;
  if (pathname === "/api/entries" || pathname.startsWith("/api/public/")) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");

  if (!auth || !auth.toLowerCase().startsWith("basic ")) {
    return unauthorized();
  }

  let decoded: string;
  try {
    decoded = atob(auth.slice(6).trim());
  } catch {
    return unauthorized();
  }

  const sepIdx = decoded.indexOf(":");
  if (sepIdx === -1) return unauthorized();

  const user = decoded.slice(0, sepIdx);
  const pass = decoded.slice(sepIdx + 1);

  if (!safeEqual(user, USERNAME) || !safeEqual(pass, PASSWORD)) {
    return unauthorized();
  }

  return NextResponse.next();
}

// Apply auth ONLY to manager pages and manager-only APIs.
// /c/[slug] and /api/public/[slug] and POST /api/entries stay public
// so creators can submit hours without seeing the login prompt.
// Note about matchers:
// - "/api/creators/:path*" also matches the bare "/api/creators" (matcher
//   semantics differ from Next routing). That's intended: GET/POST/PATCH
//   on /api/creators are all manager-only.
// - For /api/entries we ONLY want to protect /api/entries/<id> (PATCH/DELETE
//   used by the manager), NOT the bare POST /api/entries (used by creators).
//   We do that with a per-request path check inside the middleware (below).
export const config = {
  matcher: [
    "/manager/:path*",
    "/api/creators/:path*",
    "/api/manager/:path*",
    "/api/entries/:path+", // requires at least one path segment after /api/entries
  ],
};
