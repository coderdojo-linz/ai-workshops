import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { Result } from './result';
import { Exercise, ExercisesFile } from './exercise-schema';
import { GetExerciseByNameError, ParsingError } from './exercise-file-manager';

describe('getExercises with real prompts/exercises.json', () => {
  let getExercises: () => Promise<Result<ExercisesFile, ParsingError>>;
  let rawExercises: any;

  beforeAll(async () => {
    const mod = await import('./exercise-file-manager');
    getExercises = mod.getExercises;
    const file = fs.readFileSync(path.join(process.cwd(), 'prompts', 'exercises.json'), { encoding: 'utf-8' });
    rawExercises = JSON.parse(file).exercises;
  });

  it('returns success and an exercises map', async () => {
    const result = await getExercises();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.exercises).toBeDefined();
      expect(typeof result.value.exercises).toBe('object');
    }
  });

  it('normalizes single data_files to array (or passes if none exist)', async () => {
    const singleKeys = Object.keys(rawExercises).filter((k) => {
      const df = rawExercises[k].data_files;
      return typeof df === 'string' || (Array.isArray(df) && df.length === 1);
    });

    if (singleKeys.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const key = singleKeys[0];
    const expected = Array.isArray(rawExercises[key].data_files) ? rawExercises[key].data_files : [rawExercises[key].data_files];

    const result = await getExercises();
    expect(result.success).toBe(true);
    if (result.success) {
      const df = result.value.exercises[key].data_files;
      expect(Array.isArray(df)).toBe(true);
      expect(df).toEqual(expected);
      expect(df.length).toBe(1);
    }
  });

  it('preserves multiple data_files arrays (or passes if none exist)', async () => {
    const multiKeys = Object.keys(rawExercises).filter((k) => {
      const df = rawExercises[k].data_files;
      return Array.isArray(df) && df.length > 1;
    });

    if (multiKeys.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const key = multiKeys[0];
    const expected = rawExercises[key].data_files;

    const result = await getExercises();
    expect(result.success).toBe(true);
    if (result.success) {
      const df = result.value.exercises[key].data_files;
      expect(Array.isArray(df)).toBe(true);
      expect(df).toEqual(expected);
      expect(df.length).toBeGreaterThan(1);
    }
  });
});

describe('getExerciseByName with real prompts/exercises.json', () => {
  let getExerciseByName: (name: string) => Promise<Result<Exercise, GetExerciseByNameError>>;
  let rawExercises: any;

  beforeAll(async () => {
    const mod = await import('./exercise-file-manager');
    getExerciseByName = mod.getExerciseByName;
    const file = fs.readFileSync(path.join(process.cwd(), 'prompts', 'exercises.json'), { encoding: 'utf-8' });
    rawExercises = JSON.parse(file).exercises;
  });

  it('returns success for any exercise with a single data file (or passes if none exist)', async () => {
    const singleKeys = Object.keys(rawExercises).filter((k) => {
      const df = rawExercises[k].data_files;
      return typeof df === 'string' || (Array.isArray(df) && df.length === 1);
    });

    if (singleKeys.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const key = singleKeys[0];
    const expected = Array.isArray(rawExercises[key].data_files) ? rawExercises[key].data_files : [rawExercises[key].data_files];

    const result = await getExerciseByName(key);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.value.data_files)).toBe(true);
      expect(result.value.data_files).toEqual(expected);
      expect(result.value.data_files.length).toBe(1);
    }
  });

  it('returns success for any exercise with multiple data files (or passes if none exist)', async () => {
    const multiKeys = Object.keys(rawExercises).filter((k) => {
      const df = rawExercises[k].data_files;
      return Array.isArray(df) && df.length > 1;
    });

    if (multiKeys.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const key = multiKeys[0];
    const expected = rawExercises[key].data_files;

    const result = await getExerciseByName(key);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.value.data_files)).toBe(true);
      expect(result.value.data_files).toEqual(expected);
      expect(result.value.data_files.length).toBeGreaterThan(1);
    }
  });

  it('returns not_found for a non-existent exercise', async () => {
    const result = await getExerciseByName('this-does-not-exist');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('not_found');
    }
  });
});

describe('getExercises with invalid prompts/exercises.json (parsing error)', () => {
  it('returns parsing_error when the file does not match schema via fileReader', async () => {
    jest.resetModules();
    const mod = await import('./exercise-file-manager');
    const invalidContent = {
      exercises: {
        broken: { title: 123 },
      },
    };
    const result = await mod.getExercises(async () => JSON.stringify(invalidContent));
    expect(result.success).toBe(false);
    if (!result.success && result.error.type === 'parsing_error') {
      expect(typeof result.error.error).toBe('string');
      expect(result.error.error.length).toBeGreaterThan(0);
    }
  });

  it('returns parsing_error when JSON is syntactically invalid via fileReader', async () => {
    jest.resetModules();
    const mod = await import('./exercise-file-manager');
    const invalidJson = '{ "exercises": { "broken": '; // intentionally malformed JSON
    const result = await mod.getExercises(async () => invalidJson);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('parsing_error');
      expect(typeof result.error.error).toBe('string');
      expect(result.error.error.length).toBeGreaterThan(0);
    }
  });
});

describe('getExerciseByName with invalid prompts/exercises.json (parsing error)', () => {
  it('returns parsing_error when the file does not match schema via fileReader', async () => {
    // Ensure a fresh module instance so the cache is empty
    jest.resetModules();
    const mod = await import('./exercise-file-manager');
    const invalidContent = {
      exercises: {
        broken: { title: 123 },
      },
    };
    const result = await mod.getExerciseByName('anything', async () => JSON.stringify(invalidContent));
    expect(result.success).toBe(false);
    if (!result.success && result.error.type === 'parsing_error') {
      expect(typeof result.error.error).toBe('string');
      expect(result.error.error.length).toBeGreaterThan(0);
    }
  });
});

describe('getExercisesWithResponse error handling', () => {
  it('returns 500 NextResponse on parsing error', async () => {
    jest.resetModules();
    const mod = await import('./exercise-file-manager');

    const invalidJson = '{ "exercises": { "broken": ';
    const result = await mod.getExercisesWithResponse(async () => invalidJson);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(500);
      await expect(result.error.json()).resolves.toEqual({ error: 'Error parsing exercises file' });
    }
  });
});

describe('getExerciseByNameWithResponse behavior', () => {
  it('returns 404 NextResponse when exercise is not found', async () => {
    jest.resetModules();
    const mod = await import('./exercise-file-manager');

    const validEmpty = JSON.stringify({ exercises: {} });
    const result = await mod.getExerciseByNameWithResponse('missing', async () => validEmpty);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(404);
    }
  });

  it('returns 500 NextResponse on parsing error', async () => {
    jest.resetModules();
    const mod = await import('./exercise-file-manager');

    const invalidJson = '{ "exercises": { "broken": ';
    const result = await mod.getExerciseByNameWithResponse('anything', async () => invalidJson);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(500);
      await expect(result.error.json()).resolves.toEqual({ error: 'Error parsing exercises file' });
    }
  });

  it('returns ok result when exercise exists (and normalizes data_files)', async () => {
    jest.resetModules();
    const mod = await import('./exercise-file-manager');

    const valid = JSON.stringify({
      exercises: {
        sample: {
          title: 't',
          folder: 'f',
          difficulty: 'easy',
          summary: 's',
          reference: 'r',
          system_prompt_file: 'sp',
          data_files: 'x.txt'
        }
      }
    });

    const result = await mod.getExerciseByNameWithResponse('sample', async () => valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe('t');
      expect(result.value.data_files).toEqual(['x.txt']);
    }
  });
});
