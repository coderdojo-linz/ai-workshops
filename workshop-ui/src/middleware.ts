import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/images/') || // Static images
    pathname.startsWith('/api/') || // API routes (handled separately)
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/workshops') || // TODO: Add proper auth for workshops
    pathname === '/login' || // Allow access to login page
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check authentication status by calling the auth API
  let isAuthenticated = false // Default to false
  try {
    const response = await fetch(new URL('/api/auth', request.url), {
      method: 'GET',
      headers: request.headers,
      credentials: 'include',
    })
    const data = await response.json()
    if (data.authenticated) {
      isAuthenticated = true
    }
  } catch (error) {
    console.error('Error checking authentication:', error)
    isAuthenticated = false
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