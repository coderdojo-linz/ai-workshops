import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { AzureOpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory store for session ID -> OpenAI response ID mapping
// TODO: Persist this to a database later
const sessionResponseMap = new Map<string, string>();
let datasaurusFileId = '';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!datasaurusFileId) {
      datasaurusFileId = await client.files.getFileId('daten-hoehle.csv');
      if (!datasaurusFileId) {
        const inputStream = fs.createReadStream(path.join(process.cwd(), 'prompts', 'daten-hoehle.csv'));
        const file = await client.files.create({
          file: inputStream,
          purpose: 'user_data',
        });
        datasaurusFileId = file.id;
      }
    }

    // Get or create session ID
    const session = await getSession();
    let sessionId = session.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      session.sessionId = sessionId;
      await session.save();
    }

    // Get previous response ID from in-memory store
    const previousResponseId = sessionResponseMap.get(sessionId);

    // Read system prompt
    const systemPromptPath = path.join(process.cwd(), 'prompts', 'system-prompt.md');
    const systemPrompt = await fs.promises.readFile(systemPromptPath, { encoding: 'utf-8' });

    // Create the OpenAI stream
    const openaiResponse = await client.responses.create({
      model: 'gpt-4.1',
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
            file_ids: [datasaurusFileId],
          },
        },
      ],
    });

    // Create encoder outside the stream
    const encoder = new TextEncoder();

    // Stream immediately as chunks arrive
    const stream = new ReadableStream({
      async start(controller) {
        // Create log file with ISO8601 timestamp
        // const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        // const logFileName = `${timestamp}.json`;
        // const logFilePath = path.join(process.cwd(), logFileName);

        try {
          for await (const event of openaiResponse) {
            // Log the event to file
            // try {
            //   const eventLog = JSON.stringify(event) + '\n';
            //   await fs.promises.appendFile(logFilePath, eventLog, 'utf-8');
            // } catch (logError) {
            //   console.error('Error writing to log file:', logError);
            // }

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
                const data = JSON.stringify({ delta: '\n\n\`\`\`py\n' });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                break;
              }
              case 'response.code_interpreter_call_code.delta': {
                const data = JSON.stringify({ delta: event.delta });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                break;
              }
              case 'response.code_interpreter_call.completed': {
                const data = JSON.stringify({ delta: '\n\`\`\`\n\n' });
                controller.enqueue(encoder.encode(`data: ${data}\n\n` ));
                break;
              }
              case 'response.output_text.annotation.added': {
                const file = await client.containers.files.content.retrieve((event.annotation as any).file_id, {
                  container_id: (event.annotation as any).container_id,
                });

                // Write the content of the file into the public folder
                const publicPath = path.join(process.cwd(), 'public', 'images', `${(event.annotation as any).filename}`);
                await fs.promises.writeFile(publicPath, Buffer.from(await file.arrayBuffer()));
                
                // Create markdown image with data URI
                const markdownImage = `![Generated Image](/${path.join("images", (event.annotation as any).filename)})`;
                
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
          controller.close();
        } catch (error) {
          console.error('Error in chat stream:', error);
          const errorData = JSON.stringify({
            delta: 'Sorry, there was an error processing your message.',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
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
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
