import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getExerciseByName } from '@/lib/exercise-file-manager';
import { trace } from '@opentelemetry/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exerciseId } = await params;
    
    // Get request-scoped span
    const span = trace.getActiveSpan();

    const exerciseResult = await getExerciseByName(exerciseId);
    if (!exerciseResult.success) {
      switch (exerciseResult.error.type) {
        case 'not_found':
          return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
        case 'parsing_error':
          span?.addEvent('exercises_file_validation_error', { error: exerciseResult.error.error });
          return NextResponse.json({ error: 'Error parsing exercises file' }, { status: 500 });
      }
    }
    
    const exercise = exerciseResult.exercise;
    
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