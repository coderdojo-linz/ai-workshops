import { NextRequest, NextResponse } from 'next/server';
import { getAppSessionFromRequest, getChatSession, validateAppSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';
import { trace, Span } from '@opentelemetry/api';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';
import { runOpenAI } from './openaiRunner';
import { decrypt, encrypt } from '@/lib/encryption';
import path from 'path';
import fs from 'fs';

const tracer = trace.getTracer('ai-workshop-chat');

/**
 * @route   POST /api/chat
 * @desc    Send a chat message
 * @body    { message: string, encryptedPreviousResponseId: string | undefined }
 * @urlParam exercise: string
 * @response 200 { response: string } or 400 { error: string }
 * @access  Protected (any authenticated user/workshop)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const response = NextResponse.next();
    const appSession = await getAppSessionFromRequest(request, response);
    if (!await validateAppSession(appSession)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get body payload and query string parameters
    const { message, encryptedPreviousResponseId, userSystemPrompt } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    const exercise = request.nextUrl.searchParams.get('exercise');
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise parameter is required' }, { status: 400 });
    }

    const exerciseResult = await getExerciseByNameWithResponse(exercise);
    if (!exerciseResult.success) {
      return exerciseResult.error;
    }

    const exerciseData = exerciseResult.value;

    // Construct system prompt
    const metaSystemPrompt = fs.readFileSync(path.join(process.cwd(), 'prompts', exerciseData.folder, 'meta.md'), 'utf-8');

    let systemPrompt = metaSystemPrompt;
    if (userSystemPrompt && userSystemPrompt.trim().length > 0) {
      systemPrompt += `\n\nThe requested user instructions: ${userSystemPrompt.trim()}`;
    }

    // Get or create session ID
    const session = await getChatSession();
    let sessionId = session.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      session.sessionId = sessionId;
      await session.save();
    }

    let previousResponseId: string | undefined = undefined;
    if (encryptedPreviousResponseId) {
      try {
        previousResponseId = decrypt(encryptedPreviousResponseId, Buffer.from(process.env.PREVIOUS_RESPONSE_ID_SECRET!, 'hex'));
      } catch {}
    }

    // Run OpenAI and stream response
    return await tracer.startActiveSpan('generating_response', async (span: Span) => {
      // Create encoder outside the stream
      const encoder = new TextEncoder();

      // Stream immediately as chunks arrive
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const newPreviousResponseId = await runOpenAI(
              message,
              systemPrompt,
              previousResponseId,
              (delta) => {
                const data = JSON.stringify({ delta });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            );

            // Update session with new response ID
            // Encrypt previousResponseId before sending to client
            let encryptedResponseId: string | undefined;
            // console.log('New previousResponseId:', newPreviousResponseId);
            // console.log('Encryption key:', process.env.PREVIOUS_RESPONSE_ID_SECRET);
            // Revert key.toString('hex') first

            encryptedResponseId = encrypt(newPreviousResponseId, Buffer.from(process.env.PREVIOUS_RESPONSE_ID_SECRET!, 'hex'));

            const data = JSON.stringify({ encryptedResponseId });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } catch (error) {
            console.error('Error in chat stream:', error);
            const errorData = JSON.stringify({
              delta: 'Sorry, there was an error processing your message.',
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          } finally {
            controller.close();
            span.end();
          }
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
