import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'workshops', 'workshops.json');

function readWorkshops() {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeWorkshops(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// GET: alle Workshops auslesen
export async function GET() {
  const workshops = readWorkshops();
  return NextResponse.json(workshops);
}

// POST: neuen Workshop anlegen
export async function POST(req: Request) {
  try {
    const newWorkshop = await req.json();
    console.log("Raw body",newWorkshop)
    const workshops = readWorkshops();

    // ID generieren
    newWorkshop.id = Date.now();
    newWorkshop.status = newWorkshop.status || 'geplant';

    workshops.push(newWorkshop);
    writeWorkshops(workshops);

    return NextResponse.json(newWorkshop, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}