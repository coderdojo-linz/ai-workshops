import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { readWorkshops, writeWorkshops } from '@/lib/workshopService';
import { WorkshopSchema } from '@/lib/workshop-schema';
import { verify } from 'crypto';
import { verifyAdmin } from '@/lib/session';

// Funktion zur Generierung eines eindeutigen Workshop-Codes
function generateWorkshopCode(): string {
  // Erlaubte Zeichen: Großbuchstaben und Zahlen, aber ohne 1, 0, O, I
  const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  // Generiere einen 6-stelligen Code
  for (let i = 0; i < 6; i++) {
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

/**
 * @route   GET /api/workshops
 * @desc    Get all workshops (sorted by date and time descending)
 * @response 200 { workshops: Workshop[] }
 * @access  Admin only
 */
export async function GET() {
  if (! (await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
  }

  const workshops = await readWorkshops();

  workshops.sort((a: any, b: any) => {
    const dateA = new Date(a.startDateTime);
    const dateB = new Date(b.startDateTime);
    return dateB.getTime() - dateA.getTime();
  });

  return NextResponse.json(workshops, { status: StatusCodes.OK });
}

/**
 * @route   POST /api/workshops
 * @desc    Create a new workshop
 * @body    { WorkshopProps (see schema) without id and code }
 * @response 201 { workshop: Workshop } or 400 { error: string }
 * @access  Admin only
 */
export async function POST(req: Request) {
  if (! (await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: StatusCodes.UNAUTHORIZED });
  }

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
    const workshops = await readWorkshops();

    // Generiere einen eindeutigen Code für den Workshop
    const code = generateUniqueCode(workshops);

    const newWorkshop = {
      ...data,
      id: Date.now(),
      code: code,
    };

    workshops.push(newWorkshop);
    if (await writeWorkshops(workshops)) {
      return NextResponse.json(newWorkshop, { status: StatusCodes.CREATED });
    } else {
      return NextResponse.json({ error: 'Failed to save workshop' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
    }


  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: StatusCodes.BAD_REQUEST });
  }
}
