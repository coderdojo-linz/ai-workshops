import { NextRequest, NextResponse } from 'next/server';
import { generateMetadata } from '@/lib/promptService';
import { getAppSessionFromRequest, validateAppSession } from '@/lib/session';

/** 
 * @route   POST /api/system-prompts/save
 * @desc    Save the current system prompt to Azure Blob Storage
 * @body    { prompt: string }
 * @response 200 { message: string, url: string } or 400 { error: string } or 401 { error: string } or 501 { error: string }
 * @access  Protected (any authenticated user/workshop)
 */
export async function POST(
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

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
    }
    await generateMetadata(id);

    return NextResponse.json({ message: 'System prompt saved successfully', id }, { status: 200 });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
