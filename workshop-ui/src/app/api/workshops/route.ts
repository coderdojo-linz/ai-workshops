import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { readWorkshops,writeWorkshops } from '@/app/api/workshops/workshopService';
import { WorkshopSchema } from '@/lib/workshop-schema';

// Funktion zur Generierung eines eindeutigen Workshop-Codes
function generateWorkshopCode(): string {
  // Erlaubte Zeichen: Großbuchstaben und Zahlen, aber ohne 1, 0, O, I
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  
  // Generiere einen 8-stelligen Code
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * allowedChars.length);
    code += allowedChars[randomIndex];
  }
  
  return code;
}

// Funktion zur Überprüfung, ob ein Code bereits existiert
function isCodeUnique(code: string, workshops: any[]): boolean {
  return !workshops.some(workshop => workshop.code === code);
}

// Funktion zur Generierung eines eindeutigen Codes
function generateUniqueCode(workshops: any[]): string {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateWorkshopCode();
    attempts++;
  } while (!isCodeUnique(code, workshops) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('Could not generate unique workshop code');
  }
  
  return code;
}


// GET: alle Workshops auslesen und sortieren
export async function GET() {
  const workshops = readWorkshops();

  workshops.sort((a: { date: string; startTime: string }, b: { date: string; startTime: string }) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date); // descending date
    }
    return b.startTime.localeCompare(a.startTime); // descending time
  });

  return NextResponse.json(workshops, { status: StatusCodes.OK });
}


// POST: neuen Workshop anlegen
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = WorkshopSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.format() },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const data = parseResult.data;
    const workshops = readWorkshops();
    
    // Generiere einen eindeutigen Code für den Workshop
    const code = generateUniqueCode(workshops);
    
    const newWorkshop = {
      ...data,
      id: Date.now(),
      code: code,
    };

    workshops.push(newWorkshop);
    writeWorkshops(workshops);

    return NextResponse.json(newWorkshop, { status: StatusCodes.CREATED });

  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: StatusCodes.BAD_REQUEST });
  }
}
