import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { readWorkshops,writeWorkshops } from '@/app/api/workshops/workshopService';

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workshops = readWorkshops();
  const workshop = workshops.find((w: any) => String(w.id) === id);

  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  return NextResponse.json(workshop, { status: StatusCodes.OK });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const updateFields = await req.json();
  const workshops = readWorkshops();

  const index = workshops.findIndex((w: any) => String(w.id) === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  // Code sollte nicht überschrieben werden - entferne es aus den Update-Feldern
  const { code, ...fieldsToUpdate } = updateFields;

  workshops[index] = { ...workshops[index], ...fieldsToUpdate };
  writeWorkshops(workshops);

  return NextResponse.json(workshops[index]);
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workshops = readWorkshops();

  const exists = workshops.some((w: any) => String(w.id) === id);
  if (!exists) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  const updated = workshops.filter((w: any) => String(w.id) !== id);
  writeWorkshops(updated);

  return NextResponse.json({ success: true });
}
