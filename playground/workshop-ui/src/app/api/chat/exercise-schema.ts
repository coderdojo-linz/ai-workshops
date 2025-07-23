import { z } from 'zod/v4';

// Schema for individual exercise objects
const ExerciseSchema = z.object({
  title: z.string(),
  folder: z.string(),
  system_prompt_file: z.string(),
  data_file: z.string(),
});

// Schema for the entire exercises file
const ExercisesFileSchema = z.object({
  exercises: z.record(z.string(), ExerciseSchema)
});

// Type inference from the schema
type Exercise = z.infer<typeof ExerciseSchema>;
type ExercisesFile = z.infer<typeof ExercisesFileSchema>;

// Function to validate the exercises file
export function validateExercisesFile(data: unknown): ExercisesFile {
  return ExercisesFileSchema.parse(data);
}

// Function for safe validation (returns result object instead of throwing)
export function safeValidateExercisesFile(data: unknown) {
  return ExercisesFileSchema.safeParse(data);
}

// Export schemas and types
export { ExerciseSchema, ExercisesFileSchema };
export type { Exercise, ExercisesFile }; 