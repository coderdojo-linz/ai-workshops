import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { AzureOpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import '@/lib/files';
import { FunctionTool } from 'openai/resources/responses/responses.mjs';
import { ExercisesFile, validateExercisesFile } from '@/lib/exercise-schema';
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

const questSolvedFunctionDefinition: FunctionTool = {
  type: 'function',
  name: 'mark_quest_as_solved',
  description: 'Marks the current quest as solved',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  },
  strict: true,
};

const knowKidsNameFunctionDefinition: FunctionTool = {
  type: 'function',
  name: 'mark_kids_name_as_known',
  description: 'Must be called when the AI has learned the name of the child',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  },
  strict: true,
};

const sharedKeyCredential = new StorageSharedKeyCredential(
  process.env.STORAGE_ACCOUNT!, 
  process.env.STORAGE_ACCOUNT_KEY!);
const blobServiceClient = new BlobServiceClient(
  `https://${process.env.STORAGE_ACCOUNT!}.blob.core.windows.net`,
  sharedKeyCredential,
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory store for session ID -> OpenAI response ID mapping
// TODO: Persist this to a database later
const sessionResponseMap = new Map<string, string>();
let dataFileIds: Map<string, string> = new Map();
let exercises: ExercisesFile | undefined;

export async function POST(request: NextRequest) {
  try {
    const { message, resetConversation } = await request.json();
    
    // Get the exercise query parameter
    const exercise = request.nextUrl.searchParams.get('exercise');
    if (!exercise) {
      return NextResponse.json({ error: 'Exercise parameter is required' }, { status: 400 });
    }

    if (!exercises) {
      const exercisesFile = await fs.promises.readFile(path.join(process.cwd(), 'prompts', 'exercises.json'), { encoding: 'utf-8' });
      try {
        exercises = validateExercisesFile(JSON.parse(exercisesFile));
      } catch (error) {
        return NextResponse.json({ error: 'Error parsing exercises file' }, { status: 500 });
      }
    }

    const exerciseData = exercises.exercises[exercise];
    if (!exerciseData) {
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

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

    // Create the OpenAI stream
    const openaiResponse = await client.responses.create({
      model: 'gpt-5',
      instructions: systemPrompt,
      input: message,
      stream: true,
      store: true,
      previous_response_id: previousResponseId,
      tools: [
        //knowKidsNameFunctionDefinition,
        //questSolvedFunctionDefinition,
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
                const containerClient = blobServiceClient.getContainerClient("ai-workshop");
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
