import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSessionToken } from "@/lib/session";

// Runs before every page request and Server Action (they're POSTs to the
// page's path). Anyone without a valid session cookie is sent to /login.
export function proxy(request: NextRequest) {
  const unlocked = isValidSessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const onLoginPage = request.nextUrl.pathname === "/login";

  if (!unlocked && !onLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (unlocked && onLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next.js internals (JS, CSS, images) and the favicon.
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
