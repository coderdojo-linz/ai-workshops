import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { trace, Span } from '@opentelemetry/api';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';

const sharedKeyCredential = new StorageSharedKeyCredential(process.env.STORAGE_ACCOUNT!, process.env.STORAGE_ACCOUNT_KEY!);
const blobServiceClient = new BlobServiceClient(`https://${process.env.STORAGE_ACCOUNT!}.blob.core.windows.net`, sharedKeyCredential);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tracer = trace.getTracer('ai-workshop-chat');

// In-memory store for session ID -> OpenAI response ID mapping
// TODO: Persist this to a database later
const sessionResponseMap = new Map<string, string>();
let dataFileIds: Map<string, string> = new Map();

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

    // Process all data files for this exercise
    const exerciseFileIds: string[] = [];
    for (const dataFile of exerciseData.data_files) {
      if (!dataFileIds.has(dataFile)) {
        let dataFileId = await client.files.getFileId(dataFile);
        if (!dataFileId) {
          const inputStream = fs.createReadStream(path.join(process.cwd(), 'prompts', exerciseData.folder, dataFile));
          const file = await client.files.create({
            file: inputStream,
            purpose: 'user_data',
          });
          dataFileId = file.id;
        }

        dataFileIds.set(dataFile, dataFileId);
      }
      exerciseFileIds.push(dataFileIds.get(dataFile)!);
    }

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
    const previousResponseId = sessionResponseMap.get(sessionId);

    // Read system prompt
    const systemPromptPath = path.join(process.cwd(), 'prompts', exerciseData.folder, exerciseData.system_prompt_file);
    const systemPrompt = await fs.promises.readFile(systemPromptPath, { encoding: 'utf-8' });

    return await tracer.startActiveSpan('generating_response', async (span: Span) => {
      // Create the OpenAI stream
      const openaiResponse = await client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5',
        instructions: systemPrompt,
        input: message,
        stream: true,
        store: true,
        previous_response_id: previousResponseId,
        tools: [
          {
            type: 'code_interpreter',
            container: {
              type: 'auto',
              file_ids: exerciseFileIds,
            },
          },
        ],
      });

      // Create encoder outside the stream
      const encoder = new TextEncoder();

      // Stream immediately as chunks arrive
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of openaiResponse) {
              if (process.env.LOG_EVENTS === 'true') {
                span.addEvent(event.type, { eventJson: JSON.stringify(event) });
              }

              switch (event.type) {
                case 'response.created':
                  sessionResponseMap.set(sessionId, event.response.id);
                  break;
                case 'response.output_text.delta': {
                  const data = JSON.stringify({ delta: event.delta });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  break;
                }
                case 'response.code_interpreter_call.in_progress': {
                  const data = JSON.stringify({ delta: '\n\n```py\n' });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  break;
                }
                case 'response.code_interpreter_call_code.delta': {
                  const data = JSON.stringify({ delta: event.delta });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  break;
                }
                case 'response.code_interpreter_call.completed': {
                  const data = JSON.stringify({ delta: '\n```\n\n' });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  break;
                }
                case 'response.output_text.annotation.added': {
                  const file = await client.containers.files.content.retrieve((event.annotation as any).file_id, {
                    container_id: (event.annotation as any).container_id,
                  });

                  // Upload the file to the Azure Blob Storage
                  const containerClient = blobServiceClient.getContainerClient('ai-workshop');
                  const blockBlobClient = containerClient.getBlockBlobClient((event.annotation as any).filename);
                  const uploadBuffer = Buffer.from(await file.arrayBuffer());
                  await blockBlobClient.upload(uploadBuffer, uploadBuffer.length);

                  // Create markdown image with data URI
                  const markdownImage = `![Generated Image](${blockBlobClient.url})`;

                  // Send as a text delta (like other content)
                  const data = JSON.stringify({ delta: `\n\n${markdownImage}\n\n` });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                  break;
                }
                default:
                  break;
              }
            }

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
