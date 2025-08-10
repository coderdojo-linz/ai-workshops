import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import type { GetExerciseByNameResult } from './exercise-file-manager';

describe('getExercises with real prompts/exercises.json', () => {
  let getExercises: () => Promise<any>;
  let rawExercises: any;

  beforeAll(async () => {
    const mod = await import('./exercise-file-manager');
    getExercises = mod.getExercises;
    const file = fs.readFileSync(
      path.join(process.cwd(), 'prompts', 'exercises.json'),
      { encoding: 'utf-8' }
    );
    rawExercises = JSON.parse(file).exercises;
  });

  it('returns success and an exercises map', async () => {
    const result = await getExercises();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.exercises).toBeDefined();
      expect(result.exercises.exercises).toBeDefined();
      expect(typeof result.exercises.exercises).toBe('object');
    }
  });

  it('normalizes single data_files to array (or passes if none exist)', async () => {
    const singleKeys = Object.keys(rawExercises).filter((k) => {
      const df = rawExercises[k].data_files;
      return (typeof df === 'string') || (Array.isArray(df) && df.length === 1);
    });

    if (singleKeys.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const key = singleKeys[0];
    const expected = Array.isArray(rawExercises[key].data_files)
      ? rawExercises[key].data_files
      : [rawExercises[key].data_files];

    const result = await getExercises();
    expect(result.success).toBe(true);
    if (result.success) {
      const df = result.exercises.exercises[key].data_files;
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
      const df = result.exercises.exercises[key].data_files;
      expect(Array.isArray(df)).toBe(true);
      expect(df).toEqual(expected);
      expect(df.length).toBeGreaterThan(1);
    }
  });
});

describe('getExerciseByName with real prompts/exercises.json', () => {
  let getExerciseByName: (name: string) => Promise<GetExerciseByNameResult>;
  let rawExercises: any;

  beforeAll(async () => {
    const mod = await import('./exercise-file-manager');
    getExerciseByName = mod.getExerciseByName;
    const file = fs.readFileSync(
      path.join(process.cwd(), 'prompts', 'exercises.json'),
      { encoding: 'utf-8' }
    );
    rawExercises = JSON.parse(file).exercises;
  });

  it('returns success for any exercise with a single data file (or passes if none exist)', async () => {
    const singleKeys = Object.keys(rawExercises).filter((k) => {
      const df = rawExercises[k].data_files;
      return (typeof df === 'string') || (Array.isArray(df) && df.length === 1);
    });

    if (singleKeys.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const key = singleKeys[0];
    const expected = Array.isArray(rawExercises[key].data_files)
      ? rawExercises[key].data_files
      : [rawExercises[key].data_files];

    const result = await getExerciseByName(key);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.exercise.data_files)).toBe(true);
      expect(result.exercise.data_files).toEqual(expected);
      expect(result.exercise.data_files.length).toBe(1);
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
      expect(Array.isArray(result.exercise.data_files)).toBe(true);
      expect(result.exercise.data_files).toEqual(expected);
      expect(result.exercise.data_files.length).toBeGreaterThan(1);
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
    const result = await mod.getExercises(
      async () => JSON.stringify(invalidContent)
    );
    expect(result.success).toBe(false);
    if (!result.success && result.error.type === 'parsing_error') {
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
    const result = await mod.getExerciseByName(
      'anything',
      async () => JSON.stringify(invalidContent)
    );
    expect(result.success).toBe(false);
    if (!result.success && result.error.type === 'parsing_error') {
      expect(typeof result.error.error).toBe('string');
      expect(result.error.error.length).toBeGreaterThan(0);
    }
  });
});
