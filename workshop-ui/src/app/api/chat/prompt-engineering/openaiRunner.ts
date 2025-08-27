import { AzureOpenAI } from 'openai';
import { trace } from '@opentelemetry/api';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import { ResponseCreateParams } from 'openai/resources/responses/responses.mjs';

const credential = new DefaultAzureCredential();
const scope = 'https://cognitiveservices.azure.com/.default';
const azureADTokenProvider = getBearerTokenProvider(credential, scope);

const model = process.env.OPENAI_MODEL || 'gpt-5';
const client = new AzureOpenAI({
  endpoint: process.env.AZURE_ENDPOINT,
  azureADTokenProvider: azureADTokenProvider,
  apiVersion: '2025-04-01-preview',
  deployment: model,
});

const tracer = trace.getTracer('ai-workshop-chat');

export async function runOpenAI(
  message: string,
  instructions: string,
  previousResponseId: string | undefined,
  messageDeltaCallback: (delta: string) => void,
): Promise<string> {

  let input: any[] = []
  input.push({ role: 'user', content: message });

  while (input.length > 0) {
    let responseArgument: ResponseCreateParams = {
      model: model,
      instructions,
      input,
      stream: true,
      store: true,
      previous_response_id: previousResponseId,
    };
    if (model === 'gpt-5') {
      responseArgument = {
        ...responseArgument,
        reasoning: {
          effort: 'minimal',
        },
      };
    }

    const openaiResponse = await client.responses.create(responseArgument);

    input = [];

    for await (const event of openaiResponse) {
      if ((<any>event).response?.id) {
        previousResponseId = (<any>event).response.id;
      }
      if (event.type === 'response.output_text.delta') {
        messageDeltaCallback(event.delta);
      }
    }
  }

  return previousResponseId!;
}
