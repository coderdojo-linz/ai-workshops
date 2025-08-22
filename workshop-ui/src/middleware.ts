import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Get the workshop session cookie
  const sessionCookie = request.cookies.get('workshop-session')

  // Check if the user is trying to access the login page
  if (pathname === '/login') {
    // If there's a session cookie, they might be authenticated - let them through to potentially redirect
    // The actual authentication check will happen on the client side
    return NextResponse.next()
  }

  // For all other routes, check if session cookie exists
  // Note: We can't decrypt iron-session in edge middleware, so we rely on the presence of the cookie
  // and client-side checks for actual authentication validation
  if (!sessionCookie) {
    // Redirect to login page if no session cookie
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Session cookie exists, allow access (actual authentication verified client-side)
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  // Run on all routes - we handle exclusions in the middleware function
  matcher: [
    '/(.*)',
  ],
}