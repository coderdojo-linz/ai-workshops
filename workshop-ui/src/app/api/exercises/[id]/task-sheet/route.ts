import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';
import { getAppSessionFromRequest, validateAppSession } from '@/lib/session';

/** 
 * @route   GET /api/exercises/:id/task-sheet
 * @desc    Get the task sheet content for a specific exercise by ID (folder name)
 * @query   id
 * @response 200 text/plain or 500/404 { error: string }
 * @access  Protected (any authenticated user/workshop)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validate authentication
  const nextResponse = NextResponse.next();
  const appSession = await getAppSessionFromRequest(request, nextResponse);
  if (!await validateAppSession(appSession)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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