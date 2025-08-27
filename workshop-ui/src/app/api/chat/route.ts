import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAppSessionFromRequest, getChatSession, validateAppSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';
import { trace, Span } from '@opentelemetry/api';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';
import { executePython } from './codeExecutionTool';
import { runOpenAI } from './openaiRunner';
import { decrypt, encrypt } from '@/lib/encryption';

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
    const { message, encryptedPreviousResponseId } = await request.json();
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
      // console.log('Received encryptedPreviousResponseId:', encryptedPreviousResponseId);
      try {
        previousResponseId = decrypt(encryptedPreviousResponseId, Buffer.from(process.env.PREVIOUS_RESPONSE_ID_SECRET!, 'hex'));
      } catch {
      }
    }

    // Read system prompt
    const systemPromptPath = path.join(process.cwd(), 'prompts', exerciseData.folder, exerciseData.system_prompt_file);
    let systemPrompt = await fs.promises.readFile(systemPromptPath, { encoding: 'utf-8' });
    systemPrompt += `\n\n# Verfügbare CSV-Dateien\n\nHier ist eine Liste der verfügbaren CSV-Dateien mit den jeweils ersten 5 Zeilen jeder Datei.
Achtung! Die Dateien haben mehr Zeilen als hier gezeigt. Alle Dateien sind im Ordner /mnt/data abgelegt.\n\n<data-files>`;
    for (const dataFile of exerciseData.data_files) {
      systemPrompt += `<data-file fileName="/mnt/data/${dataFile}">\n`;
      const dataFileContent = await fs.promises.readFile(path.join(process.cwd(), 'prompts', exerciseData.folder, dataFile), { encoding: 'utf-8' });
      systemPrompt += `${dataFileContent.split('\n').slice(0, 5).join('\n')}\n`;
      systemPrompt += `</data-file>\n\n`;
    }
    systemPrompt += `</data-files>\n\n`;

    return await tracer.startActiveSpan('generating_response', async (span: Span) => {
      // Create encoder outside the stream
      const encoder = new TextEncoder();

      // Read Welcome Message
      const welcomeMessagePath = exerciseData.welcome_message_file ? path.join(process.cwd(), 'prompts', exerciseData.folder, exerciseData.welcome_message_file) : undefined;
      const welcomeMessage = welcomeMessagePath && fs.existsSync(welcomeMessagePath) ? await fs.promises.readFile(welcomeMessagePath, { encoding: 'utf-8' }) : undefined;

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
              },
              async (script) => {
                const result = await executePython(
                  script,
                  exerciseData.data_files.map(f => path.join(process.cwd(), 'prompts', exerciseData.folder, f)),
                  sessionId
                );
                if (result.resultFiles) {
                  for (const resultFile of result.resultFiles) {
                    // TODO: handle non-image files differently (see GH issue #29)
                    const markdownImage = `![Generated Image](${resultFile.url})`;
                    const data = JSON.stringify({ delta: `\n\n${markdownImage}\n\n` });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                }
                if (result.stdout || result.stderr) {
                  // TODO: send the output as a collapsed section (see GH issue #17)
                }
                return JSON.stringify(result);
              },
              welcomeMessage
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
