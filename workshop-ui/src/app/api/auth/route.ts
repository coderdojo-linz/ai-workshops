import { NextRequest, NextResponse } from 'next/server'
import { getAppSessionFromRequest, validateAppSession } from '@/lib/session'

/**
 * @route   POST /api/auth
 * @desc    Handle login and logout actions
 * @body    { action: 'login' | 'logout', code?: string }
 * @response 200 { success: boolean } or 400/401 { error: string }
 * @access  Public
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, code } = body
    const response = NextResponse.json({ success: true })

    if (action === 'login') {
      if (code === process.env.ACCESS_CODE) {
        const session = await getAppSessionFromRequest(request, response)
        session.accessCode = code
        session.isAuthenticated = true
        session.workshopId = process.env.WORKSHOP_ID || '-1'
        session.workshopName = process.env.WORKSHOP_NAME || 'Default Workshop'
        await session.save()

        return response
      } else {
        // report invalid code to client
        return NextResponse.json(
          { error: 'Invalid access code' },
          { status: 401 }
        )
      }
    } else if (action === 'logout') {
      // Clear the session
      const session = await getAppSessionFromRequest(request, response)
      session.destroy()

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

/**
 * @route   GET /api/auth
 * @desc    Get current authentication status
 * @response { authenticated: boolean, accessCode: string | null }
 * @access  Public
 */
export async function GET(request: NextRequest) {
  // Check current authentication status
  const response = NextResponse.json({ authenticated: false })

  try {
    const session = await getAppSessionFromRequest(request, response)
    const isAuthenticated = validateAppSession(session)

    return NextResponse.json({
      authenticated: isAuthenticated,
      accessCode: isAuthenticated ? session.accessCode : null,
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({
      authenticated: false,
      accessCode: null,
    })
  }
}
