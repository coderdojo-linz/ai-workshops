import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { readWorkshops,writeWorkshops } from '@/app/api/workshops/workshopService';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const workshops = readWorkshops();
  const workshop = workshops.find((w: any) => String(w.id) === params.id);

  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  return NextResponse.json(workshop);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const updateFields = await req.json();
  const workshops = readWorkshops();

  const index = workshops.findIndex((w: any) => String(w.id) === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
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
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  const updated = workshops.filter((w: any) => String(w.id) !== id);
  writeWorkshops(updated);

  return NextResponse.json({ success: true });
}
