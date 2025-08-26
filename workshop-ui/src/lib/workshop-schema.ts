import {z} from "zod";

export const WorkshopSchema = z.object({
  title: z.string().min(1),
  // ISO 8601 Date-Time Format (Using UTC time)
  // Example: 2023-03-15T10:00:00Z
  startDateTime: z.string().min(1).refine((date) => !isNaN(Date.parse(date)), {
    message: "Ungültiges Startdatum und -uhrzeit.",
  }),
  endDateTime: z.string().min(1).refine((date) => !isNaN(Date.parse(date)), {
    message: "Ungültiges Enddatum und -uhrzeit.",
  }),
  description: z.string().optional(),
}).refine(data => {
  const start = new Date(data.startDateTime);
  const end = new Date(data.endDateTime);
  return end > start;
}, {
  message: "Endzeit darf nicht vor oder gleich der Startzeit sein.",
  path: ['endDateTime'],
});

export interface Workshop extends z.infer<typeof WorkshopSchema> {
  id: number;
  code: string;
}

export type WorkshopInput = z.infer<typeof WorkshopSchema>;
