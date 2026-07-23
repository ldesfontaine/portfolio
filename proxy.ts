import { NextResponse, type NextRequest } from "next/server";

// Tracking endpoints stay public — the JS snippet on the public site must be
// able to fetch the script and post hits without an authenticated session.
const PUBLIC_STATS_PATHS = new Set(["/stats/count", "/stats/count.js"]);

// Static assets bundled into the GoatCounter binary (CSS, fonts, favicons,
// images): no sensitive data and would multiply the auth round-trip per
// dashboard load.
const STATIC_ASSET = /\.(css|js|map|svg|png|jpe?g|gif|ico|woff2?|ttf|webp)$/i;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_STATS_PATHS.has(pathname) || STATIC_ASSET.test(pathname)) {
    return NextResponse.next();
  }

  // Delegate auth to Payload's canonical session check. /api/users/me returns
  // `{ user: {...} }` for a valid session cookie, `{ user: null }` otherwise.
  // Hit the loopback (not the public origin) so this works on `internal: true`
  // Docker networks where the container can't reach itself via Traefik.
  const internalBase =
    process.env.INTERNAL_BASE_URL || "http://127.0.0.1:3000";
  const meUrl = new URL("/api/users/me", internalBase);
  const cookie = req.headers.get("cookie") ?? "";

  // Payload's cookie auth runs a CSRF check that requires either a matching
  // Origin (from `csrf` allowlist) OR Sec-Fetch-Site=same-origin. We forge the
  // Origin from SITE_URL — req.nextUrl.origin lies behind Traefik (scheme is
  // HTTP between Traefik and Next, but the canonical origin is HTTPS), so
  // using it directly fails the CSRF match in prod.
  const csrfOrigin = process.env.SITE_URL || req.nextUrl.origin;

  let authorized = false;
  try {
    const res = await fetch(meUrl, {
      headers: {
        cookie,
        accept: "application/json",
        origin: csrfOrigin,
      },
      cache: "no-store",
      redirect: "manual",
    });
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as
        | { user?: unknown }
        | null;
      authorized = Boolean(data && data.user);
    }
  } catch {
    authorized = false;
  }

  if (authorized) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", req.nextUrl.origin);
  loginUrl.searchParams.set(
    "redirect",
    req.nextUrl.pathname + req.nextUrl.search,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // `/stats`, `/stats/`, and any subpath — the optional `(/.*)?` group catches
  // the bare trailing-slash form as well as every dashboard route.
  matcher: ["/stats(/.*)?"],
};
