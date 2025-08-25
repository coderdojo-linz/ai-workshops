import { NextRequest, NextResponse } from 'next/server'
import { getAppSessionFromRequest, validateAccessCode, validateAppSession } from '@/lib/session'
import { readWorkshops } from '@/lib/workshopService'
import { Workshop } from '@/lib/workshop-schema'

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
      if (validateAccessCode(code)) {
        // Set session variables
        const session = await getAppSessionFromRequest(request, response)
        session.accessCode = code
        session.isAuthenticated = true

        // Find a workshop associated with this access code
        const workshops = readWorkshops()
        const workshop = workshops.find((w: Workshop) => w.code === code)
        if (workshop) {
          session.workshopId = workshop.id.toString()
          session.workshopName = workshop.title
        } else {
          session.workshopId = ''
          session.workshopName = 'Unknown Workshop'
        }
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
 * @response { authenticated: boolean }
 * @access  Public
 */
export async function GET(request: NextRequest) {
  // Check current authentication status
  const response = NextResponse.json({ authenticated: false })

  try {
    const session = await getAppSessionFromRequest(request, response)
    const isAuthenticated = validateAppSession(session)

    return NextResponse.json({
      authenticated: isAuthenticated
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({
      authenticated: false
    })
  }
}
