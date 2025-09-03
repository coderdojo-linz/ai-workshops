import { NextRequest, NextResponse } from 'next/server';
import { getAppSessionFromRequest, validateAppSession } from '@/lib/session';
import { readPrompt } from '@/lib/promptService';

/** 
 * @route   GET /api/system-prompts/[id]
 * @desc    Get a system prompt by ID
 * @response 200 { message: string, url: string } or 400 { error: string } or 401 { error: string } or 501 { error: string }
 * @access  Protected (any authenticated user/workshop)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate authentication
    const nextResponse = NextResponse.next();
    const appSession = await getAppSessionFromRequest(request, nextResponse);
    if (!await validateAppSession(appSession)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
    }
    // Get system prompt
    const prompt = await readPrompt(id);
    if (!prompt || !prompt.content) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({ prompt }, { status: 200 });
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
