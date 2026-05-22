import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

// Routes that don't need authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname === "/api/auth/me"
  ) {
    return NextResponse.next();
  }

  // Verify session
  const session = await getSessionFromRequest(req);

  if (!session) {
    // Redirect to login for page routes
    if (!pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // Return 401 for API routes
    return NextResponse.json({ error: "Session expirée. Veuillez vous reconnecter." }, { status: 401 });
  }

  // Inject farm_id header for API routes to use
  const headers = new Headers(req.headers);
  headers.set("x-farm-id", session.farmId);
  headers.set("x-user-id", session.userId);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
