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
    
    // Read the system prompt file
    const systemPromptPath = path.join(process.cwd(), 'prompts', exercise.folder, exercise.system_prompt_file);
    
    try {
      const systemPrompt = await fs.promises.readFile(systemPromptPath, 'utf8');
      
      // Return as plain text
      return new NextResponse(systemPrompt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (fileError) {
      console.error('Error reading system prompt file:', fileError);
      return NextResponse.json({ error: 'System prompt file not found' }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error retrieving system prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 