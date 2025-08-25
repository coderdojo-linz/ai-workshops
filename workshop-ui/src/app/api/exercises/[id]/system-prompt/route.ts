import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';
import { getAppSessionFromRequest, validateAppSession } from '@/lib/session';

/** 
 * @route   GET /api/exercises/:id/system-prompt
 * @desc    Get the system prompt content for a specific exercise by ID (folder name)
 * @query   id
 * @response 200 text/plain or 500/404 { error: string }
 * @access  Protected (any authenticated user/workshop)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const response = NextResponse.next();
    const appSession = await getAppSessionFromRequest(request, response);
    if (!await validateAppSession(appSession)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: exerciseId } = await params;

    const exerciseResult = await getExerciseByNameWithResponse(exerciseId);
    if (!exerciseResult.success) {
      return exerciseResult.error;
    }

    const exercise = exerciseResult.value;


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