import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';


const WorkshopSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  startTime: z.string(),
  endTime: z.string(),
  description: z.string().optional(),
});


const filePath = path.join(process.cwd(),  'workshops.json');

function readWorkshops() {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeWorkshops(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// GET: alle Workshops auslesen und sortieren
export async function GET() {
  const workshops = readWorkshops();

  workshops.sort((a: { date: string; startTime: string }, b: { date: string; startTime: string }) => {
    const aDate = new Date(`${a.date}T${a.startTime}`);
    const bDate = new Date(`${b.date}T${b.startTime}`);
    return aDate.getTime() - bDate.getTime();
  });


  return NextResponse.json(workshops);
}

// POST: neuen Workshop anlegen
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Raw body", body);

    const parseResult = WorkshopSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.format() },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const data = parseResult.data;

    // Zeit-Validierung: endTime > startTime
    const start = data.startTime;
    const end = data.endTime;

    // Uhrzeiten vergleichen (im Format "HH:MM")
    if (end <= start) {
      return NextResponse.json(
        { error: { endTime: { _errors: ["Endzeit darf nicht vor oder gleich der Startzeit sein."] } } },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const newWorkshop = {
      ...data,
      id: Date.now(),
    };

    const workshops = readWorkshops();
    workshops.push(newWorkshop);
    writeWorkshops(workshops);

    return NextResponse.json(newWorkshop, { status: StatusCodes.CREATED });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: StatusCodes.BAD_REQUEST });
  }
}
