import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // If user is authenticated and tries to access sign-in page, redirect to dashboard
    if (pathname === "/sign-in" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // If user is authenticated and tries to access root page, redirect to dashboard
    if (pathname === "/" && req.nextauth.token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to sign-in page without authentication
        if (pathname === "/sign-in") {
          return true;
        }
        
        // Allow access to root page without authentication
        if (pathname === "/") {
          return true;
        }
        
        // Require authentication for all dashboard routes
        if (pathname.startsWith("/dashboard")) {
          return !!token;
        }
        
        // Allow access to other pages
        return true;
      },
    },
    pages: {
      signIn: "/sign-in",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}; 