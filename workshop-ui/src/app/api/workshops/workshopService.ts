import fs from 'fs';
const filePath = './workshops.json';

export function readWorkshops() {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function writeWorkshops(data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
