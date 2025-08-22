import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, code } = body

    if (action === 'login') {
      if (code == process.env.ACCESS_CODE) {
        const res = NextResponse.json({ success: true })
        res.cookies.set({
          name: 'ACCESS',
          value: code,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 86400, // 24 hours
          path: '/',
        })
        return res;
      } else {
        // report invalid code to client
        return NextResponse.json(
          { error: 'Invalid access code' },
          { status: 401 }
        )
      }
    } else if (action === 'logout') {
      // Clear the ACCESS cookie
      const response = NextResponse.json({ success: true })
      response.cookies.delete('ACCESS')
      return response
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Check current authentication status
  const accessCookie = request.cookies.get('ACCESS')

  return NextResponse.json({
    authenticated: accessCookie?.value === process.env.ACCESS_CODE,
    cookieValue: accessCookie?.value || null,
  })
}