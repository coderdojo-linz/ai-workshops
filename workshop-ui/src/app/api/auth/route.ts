import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, code } = body
    const response = NextResponse.json({ success: true })
    
    if (action === 'login') {
      if (code === process.env.ACCESS_CODE) {
        const session = await getSessionFromRequest(request, response)
        session.accessCode = code
        session.isAuthenticated = true
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
      const session = await getSessionFromRequest(request, response)
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

export async function GET(request: NextRequest) {
  // Check current authentication status
  const response = NextResponse.json({ authenticated: false })
  
  try {
    const session = await getSessionFromRequest(request, response)
    const isAuthenticated = session.isAuthenticated === true && session.accessCode === process.env.ACCESS_CODE
    
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