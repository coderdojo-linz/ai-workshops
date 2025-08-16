import fs from 'fs';
import path from 'path';
import { ExercisesFileSchema, ExerciseSchema } from './exercise-schema';

describe('Exercises file schema validation', () => {
    const exercisesJsonPath = path.resolve(__dirname, '../../prompts/exercises.json');

    test('prompts/exercises.json conforms to schema and normalizes data_files to arrays', () => {
        const raw = fs.readFileSync(exercisesJsonPath, 'utf-8');
        const data = JSON.parse(raw);

        const parsed = ExercisesFileSchema.parse(data);
        expect(parsed).toHaveProperty('exercises'); // Ensure exercises property exists
        expect(Object.keys(parsed.exercises).length).toBeGreaterThan(0); // Ensure exercises exist

        for (const exercise of Object.values(data.exercises)) {
            expect(ExerciseSchema.safeParse(exercise).success).toBe(true);
        }
    });
});
