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
  workshopName: string;
  recheckCode: Date;
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

export async function validateAppSession(session: IronSession<AppSessionData>): Promise<boolean> {
  if (!session || !session.isAuthenticated || !session.accessCode) {
    return false;
  }

  // Recheck access code validity every 30 minutes, assume still valid in between
  if (session.recheckCode && new Date(session.recheckCode).getTime() > Date.now()) {
    return true;
  }

  return session.isAuthenticated === true && await validateAccessCode(session.accessCode);
}

export async function validateAccessCode(accessCode: string): Promise<boolean> {
  if (!accessCode) {
    return false;
  }

  const workshops = await readWorkshops();
  const workshop = workshops.find((w: Workshop) => w.code === accessCode);
  if (!workshop) {
    return false;
  }

  // TODO: proper admin verification
  // Exclude admin workshop from time check
  if (String(workshop.id) === "1756200608981") {
    return true;
  }

  // Check if we are in between start and end time
  // Allow 30 minutes before start and 30 minutes after end
  const now = new Date();
  const startTime = new Date(workshop.startDateTime);
  startTime.setMinutes(startTime.getMinutes() - 30);
  const endTime = new Date(workshop.endDateTime);
  endTime.setMinutes(endTime.getMinutes() + 30);

  // If now is before start or after end, return false 
  if (now < startTime || now > endTime) {
    return false;
  }

  return true;
}

// TODO: proper admin verification
export async function verifyAdmin(): Promise<boolean> {
  const adminWorkshopId = "1756200608981"

  const workshops = await readWorkshops();
  const workshop = workshops.find((w: Workshop) => String(w.id) === adminWorkshopId);
  if (!workshop) {
    return false;
  }
  const adminCode = workshop.code;

  const appSession = await getAppSession();
  return appSession.isAuthenticated === true && appSession.accessCode === adminCode;
}