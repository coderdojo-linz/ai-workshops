import fs from 'fs';
import path from 'path';
import { Exercise, ExercisesFile, safeValidateExercisesFile } from './exercise-schema';

export type GetExerciseByNameResult = GetExerciseByNameOk | GetExerciseByNameError;

type GetExerciseByNameOk = {
  success: true;
  exercise: Exercise;
};

type GetExerciseByNameError = {
  success: false;
  error: ParsingError | ExerciseNotFoundError;
};

type ExerciseNotFoundError = {
    type: 'not_found';
}

type ParsingError = {
    type: 'parsing_error';
    error: string;
}

// Exercise cache
let exercises: ExercisesFile | undefined;

export async function getExerciseByName(exerciseName: string, fileReader?: () => Promise<string>): Promise<GetExerciseByNameResult> {
  if (!exercises) {
    let exercisesFile: string;
    if (fileReader) {
      exercisesFile = await fileReader();
    } else {
      exercisesFile = await fs.promises.readFile(path.join(process.cwd(), 'prompts', 'exercises.json'), { encoding: 'utf-8' });
    }
    
    const validationResult = safeValidateExercisesFile(JSON.parse(exercisesFile));
    if (validationResult.success) {
      exercises = validationResult.data;
    } else {
      return { success: false, error: { type: 'parsing_error', error: validationResult.error.message } };
    }
  }

  const exerciseData = exercises.exercises[exerciseName];
  if (!exerciseData) {
    return { success: false, error: { type: 'not_found' } };
  }

  return { success: true, exercise: exerciseData };
}
