import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { validateExercisesFile, type ExercisesFile } from '@/lib/exercise-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params;
    
    // Read exercises.json
    const exercisesPath = path.join(process.cwd(), 'prompts', 'exercises.json');
    const exercisesContent = await fs.promises.readFile(exercisesPath, 'utf8');
    const exercisesData: ExercisesFile = validateExercisesFile(JSON.parse(exercisesContent));
    
    // Find the exercise
    const exercise = exercisesData.exercises[exerciseId];
    
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }
    
    // Return exercise metadata
    return NextResponse.json({
      title: exercise.title,
      folder: exercise.folder,
      system_prompt_file: exercise.system_prompt_file,
      data_file: exercise.data_file
    });
    
  } catch (error) {
    console.error('Error retrieving exercise metadata:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 