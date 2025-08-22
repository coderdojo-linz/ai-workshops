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

  // Get the ACCESS cookie
  const accessCookie = request.cookies.get('ACCESS')

  // Check if the user is trying to access the login page
  if (pathname === '/login') {
    // If already authenticated, redirect to home
    if (accessCookie?.value === process.env.ACCESS_CODE) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Let them access the login page if not authenticated
    return NextResponse.next()
  }

  // For all other routes, check authentication
  if (!accessCookie || accessCookie.value !== process.env.ACCESS_CODE) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  // Run on all routes - we handle exclusions in the middleware function
  matcher: [
    '/(.*)',
  ],
}