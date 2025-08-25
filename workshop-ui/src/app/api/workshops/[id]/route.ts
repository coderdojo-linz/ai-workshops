import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { readWorkshops, writeWorkshops } from '@/lib/workshopService';

/** 
 * @route   GET /api/workshops/:id
 * @desc    Get a single workshop by ID
 * @response 200 { workshop: Workshop } or 404 { error: string }
 * @access  Admin only // TODO
 */
export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workshops = await readWorkshops();
  const workshop = workshops.find((w: any) => String(w.id) === id);

  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  return NextResponse.json(workshop, { status: StatusCodes.OK });
}

/**
 * @route   PUT /api/workshops/:id
 * @desc    Update a workshop by ID
 * @body    { any fields from WorkshopProps (see schema) }
 * @response 200 { workshop: Workshop } or 400/404 { error: string }
 * @access  Admin only // TODO
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const updateFields = await req.json();
  const workshops = await readWorkshops();

  const index = workshops.findIndex((w: any) => String(w.id) === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  // Code sollte nicht überschrieben werden - entferne es aus den Update-Feldern
  const { code, ...fieldsToUpdate } = updateFields;

  workshops[index] = { ...workshops[index], ...fieldsToUpdate };
  if (await writeWorkshops(workshops)) {
    return NextResponse.json(workshops[index]);
  } else {
    return NextResponse.json({ error: 'Failed to save workshop' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}

/**
 * @route   DELETE /api/workshops/:id
 * @desc    Delete a workshop by ID
 * @response 200 { success: boolean } or 404 { error: string }
 * @access  Admin only // TODO
 */
export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const workshops = await readWorkshops();

  const exists = workshops.some((w: any) => String(w.id) === id);
  if (!exists) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: StatusCodes.NOT_FOUND });
  }

  const updated = workshops.filter((w: any) => String(w.id) !== id);
  if (await writeWorkshops(updated)) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: 'Failed to save workshop' }, { status: StatusCodes.INTERNAL_SERVER_ERROR });
  }
}
