import { getAppSessionFromRequest, validateAppSession } from "@/lib/session"
import { NextRequest, NextResponse } from "next/server"

/**
 * @route   GET /api/auth/me
 * @desc    Get current authentication status
 * 
 * @access  Public
 */
export async function GET(request: NextRequest) {
    // Check current authentication status
    const response = NextResponse.json({ authenticated: false })

    try {
        const session = await getAppSessionFromRequest(request, response)

        if (await validateAppSession(session)) {
            return NextResponse.json({
                authenticated: true,
                workshopName: session.workshopName,
            })
        } else {
            return NextResponse.json({}, { status: 401 })
        }
    } catch (error) {
        console.error('Session check error:', error)
        return NextResponse.json({}, { status: 401 })
    }
}
