import fs from 'fs';
import { Workshop } from './workshop-schema';
const filePath = './workshops.json';

export function readWorkshops(): Workshop[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function writeWorkshops(data: Workshop[]) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
