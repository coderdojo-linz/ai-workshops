import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// --- Chat session for unique chats ---
export interface ChatSessionData {
  sessionId: string;
}
const chatSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'chat-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax' as const,
  },
};

export async function getChatSession(): Promise<IronSession<ChatSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<ChatSessionData>(cookieStore, chatSessionOptions);
}

// Helper function for API routes that need NextRequest/NextResponse
export async function getChatSessionFromRequest(req: NextRequest, res: NextResponse): Promise<IronSession<ChatSessionData>> {
  return getIronSession<ChatSessionData>(req, res, chatSessionOptions);
}

// --- App session for authentication ---
export interface AppSessionData {
  sessionId: string;
  accessCode: string;
  isAuthenticated: boolean;
  workshopId: string;
  workshopName: string;
}

const appSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'app-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours for workshop access
    sameSite: 'lax' as const,
    path: '/',
  },
};

export async function getAppSession(): Promise<IronSession<AppSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<AppSessionData>(cookieStore, appSessionOptions);
}

// Helper function for API routes that need NextRequest/NextResponse
export async function getAppSessionFromRequest(req: NextRequest, res: NextResponse): Promise<IronSession<AppSessionData>> {
  return getIronSession<AppSessionData>(req, res, appSessionOptions);
} 

export function validateAppSession(session: IronSession<AppSessionData>): boolean {
  return session.isAuthenticated === true && session.accessCode === process.env.ACCESS_CODE;
}
