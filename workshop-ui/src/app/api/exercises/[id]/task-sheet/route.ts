import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params;
    
    const exerciseResult = await getExerciseByNameWithResponse(exerciseId);
    if (!exerciseResult.success) {
      return exerciseResult.error;
    }
    
    const exercise = exerciseResult.value;

    
    // Read the system prompt file
    const taskSheetPath = path.join(process.cwd(), 'prompts', exercise.folder, exercise.reference);
    
    try {
      const taskSheet = await fs.promises.readFile(taskSheetPath, 'utf8');
      
      // Return as plain text
      return new NextResponse(taskSheet, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } catch (fileError) {
      console.error('Error reading task sheet file:', fileError);
      return NextResponse.json({ error: 'Task sheet file not found' }, { status: 404 });
    }
    
  } catch (error) {
    console.error('Error retrieving task sheet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 