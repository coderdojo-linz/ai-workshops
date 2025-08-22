import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface SessionData {
  sessionId?: string;
  accessCode?: string;
  isAuthenticated?: boolean;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'workshop-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours for workshop access
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Helper function for API routes that need NextRequest/NextResponse
export async function getSessionFromRequest(req: NextRequest, res: NextResponse): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(req, res, sessionOptions);
} 