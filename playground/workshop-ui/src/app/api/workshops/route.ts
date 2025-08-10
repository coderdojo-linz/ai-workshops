import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { readWorkshops,writeWorkshops } from '@/app/api/workshops/workshopService';
import { WorkshopSchema } from '@/lib/workshop-schema';


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
