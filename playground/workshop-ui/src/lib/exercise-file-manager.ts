import fs from 'fs';
import path from 'path';
import { Exercise, ExercisesFile, safeValidateExercisesFile } from './exercise-schema';
import { err, ok, Result } from './result';

export type ExerciseNotFoundError = {
  type: 'not_found';
};

export type ParsingError = {
  type: 'parsing_error';
  error: string;
};

export type GetExerciseByNameError = ExerciseNotFoundError | ParsingError;

// Exercise cache
let exercises: ExercisesFile | undefined;

async function readExercisesFile(): Promise<string> {
  return await fs.promises.readFile(path.join(process.cwd(), 'prompts', 'exercises.json'), { encoding: 'utf-8' });
}

export async function getExercises(fileReader?: () => Promise<string>): Promise<Result<ExercisesFile, ParsingError>> {
  if (!exercises) {
    let exercisesFile: string;
    if (fileReader) {
      exercisesFile = await fileReader();
    } else {
      exercisesFile = await readExercisesFile();
    }

    const validationResult = safeValidateExercisesFile(JSON.parse(exercisesFile));
    if (validationResult.success) {
      exercises = validationResult.data;
    } else {
      return err({ type: 'parsing_error', error: validationResult.error.message });
    }
  }

  return ok(exercises);
}

export async function getExerciseByName(exerciseName: string, fileReader?: () => Promise<string>): Promise<Result<Exercise, GetExerciseByNameError>> {
  if (!exercises) {
    let exercisesFile: string;
    if (fileReader) {
      exercisesFile = await fileReader();
    } else {
      exercisesFile = await readExercisesFile();
    }

    const validationResult = safeValidateExercisesFile(JSON.parse(exercisesFile));
    if (validationResult.success) {
      exercises = validationResult.data;
    } else {
      return err({ type: 'parsing_error', error: validationResult.error.message });
    }
  }

  const exerciseData = exercises.exercises[exerciseName];
  if (!exerciseData) {
    return err({ type: 'not_found' });
  }

  return ok(exerciseData);
}
