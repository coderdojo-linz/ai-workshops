import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readWorkshops } from '@/lib/workshopService'
import { Workshop } from './workshop-schema';

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
  return session.isAuthenticated === true && validateAccessCode(session.accessCode);
}

export function validateAccessCode(accessCode: string): boolean {
  if (!accessCode) {
    return false;
  }

  const workshops = readWorkshops();
  const workshop = workshops.find((w: Workshop) => w.code === accessCode);
  if (!workshop) {
    return false;
  }

  // Check if we are in between start and end time
  const now = new Date();
  const startTime = new Date(`${workshop.date}T${workshop.startTime}`);
  const endTime = new Date(`${workshop.date}T${workshop.endTime}`);

  // Allow 30 minutes before start and 30 minutes after end
  startTime.setMinutes(startTime.getMinutes() - 30);
  endTime.setMinutes(endTime.getMinutes() + 30);

  if (now < startTime || now > endTime) {
    return false;
  }

  return true;
}