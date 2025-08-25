import {z} from "zod";
import { id } from "zod/v4/locales";

export const WorkshopSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ungültiges Datum"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Startzeit"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Ungültige Endzeit"),
  description: z.string().optional(),
}).refine(data => {
  const start = new Date(`1970-01-01T${data.startTime}`);
  const end = new Date(`1970-01-01T${data.endTime}`);
  return end > start;
}, {
  message: "Endzeit darf nicht vor oder gleich der Startzeit sein.",
  path: ['endTime'],
});

export interface Workshop extends z.infer<typeof WorkshopSchema> {
  id: number;
  code: string;
}

export type WorkshopInput = z.infer<typeof WorkshopSchema>;
