import { NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

const PROTECTED_PREFIXES = ["/notes", "/library", "/drafts", "/search", "/profile", "/admin"];
const ADMIN_PREFIXES = ["/admin"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAdminRoute && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/notes", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/notes/:path*", "/library/:path*", "/drafts/:path*", "/search/:path*", "/profile/:path*", "/admin/:path*"],
};
