import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { AzureOpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { trace, Span } from '@opentelemetry/api';
import { getExerciseByNameWithResponse } from '@/lib/exercise-file-manager';
import { executePythonTool } from './codeExecutionTool';
import { runOpenAI } from './openaiRunner';
import { DynamicSession } from '@/lib/dynamicSession';

const sharedKeyCredential = new StorageSharedKeyCredential(process.env.STORAGE_ACCOUNT!, process.env.STORAGE_ACCOUNT_KEY!);
const blobServiceClient = new BlobServiceClient(`https://${process.env.STORAGE_ACCOUNT!}.blob.core.windows.net`, sharedKeyCredential);

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: '2025-04-01-preview',
  deployment: 'gpt-4.1',
});

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
    systemPrompt += `\n\n# Available CSV Files\n\n<|DATA_FILES|>\n\n`;
    for (const dataFile of exerciseData.data_files) {
      systemPrompt += `\n\n/mnt/data/${dataFile}\n\n`;
    }
    systemPrompt += `\n\n</DATA_FILES>\n\n`;

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
                const dynamicSession = new DynamicSession(sessionInstanceId);
                const result = await dynamicSession.executeScript(
                  script,
                  exerciseData.data_files.map((f) => path.join(process.cwd(), 'prompts', exerciseData.folder, f))
                );

                if (result.result.executionResult && result.result.executionResult.type === 'image') {
                  // Upload the file to the Azure Blob Storage
                  const containerClient = blobServiceClient.getContainerClient('ai-workshop');
                  const resultFile = `${crypto.randomUUID()}.${result.result.executionResult.format}`;
                  const blockBlobClient = containerClient.getBlockBlobClient(resultFile);
                  const uploadBuffer = Buffer.from(result.result.executionResult.base64_data, 'base64');
                  await blockBlobClient.upload(uploadBuffer, uploadBuffer.length);

                  // Create markdown image with data URI
                  const markdownImage = `![Generated Image](${blockBlobClient.url})`;

                  // Send as a text delta (like other content)
                  const data = JSON.stringify({ delta: `\n\n${markdownImage}\n\n` });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));

                  return JSON.stringify({
                    generatedImage: blockBlobClient.url,
                  });
                } else {
                  if (result.result.executionResult && typeof result.result.executionResult !== 'object') {
                    controller.enqueue(encoder.encode(`data: ${result.result.executionResult}\n\n`));
                  }

                  return JSON.stringify({
                    stdout: result.result.stdout,
                    stderr: result.result.stderr,
                    executionResult: result.result.executionResult,
                  });
                }
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
