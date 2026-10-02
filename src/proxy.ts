import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/server/session";

/** Primera barrera del panel: sin sesión válida, todo /admin redirige al login. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  if (!(await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
