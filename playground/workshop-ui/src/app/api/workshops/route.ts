import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'app', 'workshops', 'workshops.json');

function readWorkshops() {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export async function GET() {
  const workshops = readWorkshops();
  return NextResponse.json(workshops);
}
