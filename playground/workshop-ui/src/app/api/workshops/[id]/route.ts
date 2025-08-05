import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'app', 'workshops', 'workshops.json');

function readWorkshops() {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeWorkshops(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const workshops = readWorkshops();
  const workshop = workshops.find((w: any) => String(w.id) === params.id);

  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }

  return NextResponse.json(workshop);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const updateFields = await req.json();
  const workshops = readWorkshops();

  const index = workshops.findIndex((w: any) => String(w.id) === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }

  workshops[index] = { ...workshops[index], ...updateFields };
  writeWorkshops(workshops);

  return NextResponse.json(workshops[index]);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const workshops = readWorkshops();

  const exists = workshops.some((w: any) => String(w.id) === id);
  if (!exists) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
  }

  const updated = workshops.filter((w: any) => String(w.id) !== id);
  writeWorkshops(updated);

  return NextResponse.json({ success: true });
}
