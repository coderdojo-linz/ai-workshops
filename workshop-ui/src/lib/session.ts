import { getIronSession, IronSession } from 'iron-session';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export interface SessionData {
  sessionId?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'chat-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
} 