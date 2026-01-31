import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "sbp_admin_token";

export default async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Protect admin routes
  if (nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      // Redirect to login if no token
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  if (nextUrl.pathname.startsWith('/imgs/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  if (nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  if (nextUrl.pathname.match(/\.(webp|avif|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/imgs/:path*", "/_next/static/:path*"],
};
