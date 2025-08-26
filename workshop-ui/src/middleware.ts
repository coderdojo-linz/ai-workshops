import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/images/') || // Static images
    pathname.startsWith('/api/') || // API routes (handled separately)
    pathname.startsWith('/_next/') || // Next.js internals
    pathname === '/login' || // Allow access to login page
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check authentication status by checking the session cookie
  let isAuthenticated = false // Default to false
  try {
    // Works, but we can't assume that the presence of the cookie means valid session
    isAuthenticated = request.cookies.get('app-session')?true:false
  } catch (error) {
    console.error('Error checking authentication:', error)
  }

  // If not authenticated, redirect to login page with "from" parameter
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  } else {
    return NextResponse.next()
  }
}

// Configure which routes the middleware should run on
export const config = {
  // Run on all routes - we handle exclusions in the middleware function
  matcher: [
    '/(.*)',
  ],
}