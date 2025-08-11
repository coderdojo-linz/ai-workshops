import fs from 'fs';
import path from 'path';
import { Exercise, ExercisesFile, safeValidateExercisesFile } from './exercise-schema';
import { err, isErr, ok, Result } from './result';
import { NextResponse } from 'next/server';
import { trace } from '@opentelemetry/api';

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

    let parsedExercisesFile: ExercisesFile;
    try {
      parsedExercisesFile = JSON.parse(exercisesFile);
    } catch (error) {
      return err({ type: 'parsing_error', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    const validationResult = safeValidateExercisesFile(parsedExercisesFile);
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
    const exerciseFileResult = await getExercises(fileReader);
    if (isErr(exerciseFileResult)) {
      return exerciseFileResult;
    }

    exercises = exerciseFileResult.value;
  }

  const exerciseData = exercises.exercises[exerciseName];
  if (!exerciseData) {
    return err({ type: 'not_found' });
  }

  return ok(exerciseData);
}

export async function getExercisesWithResponse(fileReader?: () => Promise<string>): Promise<Result<ExercisesFile, NextResponse<unknown>>> {
  const exerciseResult = await getExercises(fileReader);
  if (isErr(exerciseResult)) {
    const span = trace.getActiveSpan();
    span?.addEvent('exercises_file_validation_error', { error: exerciseResult.error.error });
    return err(NextResponse.json({ error: 'Error parsing exercises file' }, { status: 500 }));
  }

  return exerciseResult;
}

export async function getExerciseByNameWithResponse(exerciseName: string, fileReader?: () => Promise<string>): Promise<Result<Exercise, NextResponse<unknown>>> {
  const exerciseResult = await getExerciseByName(exerciseName, fileReader);
  if (isErr(exerciseResult)) {
    const span = trace.getActiveSpan();
    switch (exerciseResult.error.type) {
      case 'not_found':
        return err(NextResponse.json({ error: 'Exercise not found' }, { status: 404 }));
      case 'parsing_error':
        span?.addEvent('exercises_file_validation_error', { error: exerciseResult.error.error });
        return err(NextResponse.json({ error: 'Error parsing exercises file' }, { status: 500 }));
    }
  }

  return exerciseResult;
}
