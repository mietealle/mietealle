import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    if (pathname.startsWith("/vendor") && role !== "VENDOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/renter") && role !== "RENTER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/vendor/:path*", "/renter/:path*", "/admin/:path*"],
};
