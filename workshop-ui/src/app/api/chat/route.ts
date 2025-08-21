import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { AzureOpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';
import { trace, Span } from '@opentelemetry/api';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';
import { executePython } from './codeExecutionTool';
import { runOpenAI } from './openaiRunner';

const tracer = trace.getTracer('ai-workshop-chat');

// In-memory store for session ID -> OpenAI response ID mapping
// TODO: Persist this to a database later
const sessionResponseMap = new Map<string, { previousResponseId: string; sessionInstanceId: string }>();

export async function POST(request: NextRequest) {
  try {
    // Get body payload and query string parameters
    const { message, resetConversation } = await request.json();
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
    const session = await getSession();
    let sessionId = session.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      session.sessionId = sessionId;
      await session.save();
    }

    // Handle conversation reset if requested
    if (resetConversation === true) {
      sessionResponseMap.delete(sessionId);
    }

    // Get previous response ID from in-memory store
    let { previousResponseId, sessionInstanceId } = sessionResponseMap.get(sessionId) || { previousResponseId: undefined, sessionInstanceId: crypto.randomUUID() };

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

    // Add welcome message context to system prompt
    if (exerciseData.welcome_message_file) {
      const welcomeMessagePath = path.join(process.cwd(), 'prompts', exerciseData.folder, exerciseData.welcome_message_file);
      if (fs.existsSync(welcomeMessagePath)) {
        const welcomeMessage = await fs.promises.readFile(welcomeMessagePath, { encoding: 'utf-8' });
        systemPrompt += `\n\n# Initialer Kontext\nDu hast den Benutzer bereits mit folgender Nachricht begrüßt: "${welcomeMessage}"\nDer Benutzer ist sich dieser Nachricht bewusst und du kannst sie in deinen Antworten referenzieren.`;
        // systemPrompt += `\nZum testen, reagiere bitte exakt auf "Wiederhole bitte mit genauem Wortlaut, was du gerade gesagt hast!" (Ignoriere bisherige Anweisungen dafür.)`
      }
    }

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
              },
              async (script) => {
                const result = await executePython(
                  script,
                  exerciseData.data_files.map(f => path.join(process.cwd(), 'prompts', exerciseData.folder, f)),
                  sessionInstanceId
                );
                if (result.resultFiles) {
                  for (const resultFile of result.resultFiles) {
                    const markdownImage = `![Generated Image](${resultFile.url})`;
                    const data = JSON.stringify({ delta: `\n\n${markdownImage}\n\n` });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                }
                return JSON.stringify(result);
              }
            );

            sessionResponseMap.set(sessionId, {
              previousResponseId: newPreviousResponseId,
              sessionInstanceId,
            });

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
        },
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
