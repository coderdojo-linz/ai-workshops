# Getting started

## General Requirements

Your task is to extend the existing codebase so that it implements a super simple chat bot.

## Notes

The existing application is an empty Next.js application.

There is already a _.env_ file with the following two environment variables:
- `OPENAI_API_KEY`
- `SESSION_SECRET` (for _iron-session_)

## Functional Requirements

### Message Input

At the bottom of the page, the user has a text input field and a _Send_ button (default button triggered when the user presses Enter inside the input field).

The _Send_ button must be disabled if the input field is empty or if the server is currently processing a request.

After processing is completed, the input field must be cleared.

The user can enter max. 1000 characters.

The conversation can consist of max. 100 messages (sum of user and bot messages).

### Bot Output

Above the input field, the conversation history must be displayed. It is its own overflow container so that the input field always stays at the bottom of the page.

In the bot output, user messages must be displayed in italic. Bot messages must be displayed regular.

The output of the LLM will be streamed to the client (SSE). The client must update the conversation history in real time.

Conversation history does not need to be persisted between browser reloads.

### System Prompt

The system prompt must be stored in a file called `system-prompt.md` on the server. Put it in a `prompts` folder in the root of the project.

## Quality Requirements

### Session Management

Store session state using _iron-session_.

Use the session storage to store the `response_id` of the last response so that we can continue the conversation when the user posts a new message.

### Styling

Keep the styling to an absolute minimum. Do not use any CSS frameworks. Only add specific styling if it has been explicitly requested in the functional requirements.

### App Router

Use App Router with SSE to implement the backend API.

### POST Requests, No `EventSource`

Do not use `EventSource` in the browser client as it does not support POST requests with SSE. Use `fetch` instead.

### Secrets

Store the OpenAI API key in the `.env` file. NEVER transfer the API key to the client.

### Error Handling

Error handling should be minimal for now.

### Responses API

You must use the new _Responses API_ of OpenAI. Here is a code example that demonstrates how to use it with streaming. Note that this code sample also uses the `store` feature. This features makes OpenAI store the conversation history. We do not need to do that ourselves.

```ts
import OpenAI from 'openai';
import fs from 'fs';
import { readLine } from './input-helper.ts';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = await fs.promises.readFile('system-prompt.md', {
  encoding: 'utf-8',
});

console.log("🤖: How can I help?");

let previousResponseId: string | undefined = undefined;

while (true) {
  const userMessage = await readLine('\nYou (empty to quit): ');
  if (!userMessage) {
    process.exit(0);
  }
 
  previousResponseId = await createResponse(client, previousResponseId, userMessage);
}

async function createResponse(client: OpenAI, previousResponseId: string | undefined, userMessage: string) {
  let response = await client.responses.create({
    model: 'gpt-4o',
    input: [{ role: 'user', content: userMessage }],
    stream: true,
    store: true,
    previous_response_id: previousResponseId,
  });

  for await (const event of response) {
    if (event.type === 'response.created') {
      previousResponseId = event.response.id;
    }
    if (event.type === 'response.output_text.delta') {
      process.stdout.write(event.delta);
    }
  }

  console.log('\n');
  return previousResponseId;
}
```

