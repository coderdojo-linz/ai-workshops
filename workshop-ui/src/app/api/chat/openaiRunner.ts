import OpenAI, { AzureOpenAI } from 'openai';
import { trace, Span } from '@opentelemetry/api';
import { ExecutePythonParameters, executePythonTool } from './codeExecutionTool';
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

export async function runOpenAI(message: string, instructions: string,
  previousResponseId: string | undefined,
  messageDeltaCallback: (delta: string) => void,
  welcomeMessage?: string,
  enableCodeInterpreter?: boolean,
  runScriptCallback?: (script: string) => Promise<string>,
): Promise<string> {

  let input: any[] = []
  if (!previousResponseId && welcomeMessage) {
    input.push({ role: 'assistant', content: welcomeMessage });
  }
  input.push({ role: 'user', content: message });

  while (input.length > 0) {
    let responseArgument: ResponseCreateParams = {
      model: model,
      instructions,
      input,
      stream: true,
      store: true,
      previous_response_id: previousResponseId,
      parallel_tool_calls: false,
      tools: enableCodeInterpreter ? [executePythonTool] : [],
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
    let currentFunctionName: string | undefined;
    let currentFunctionCallId: string | undefined;
    let currentScript = '';

    for await (const event of openaiResponse) {
      if ((<any>event).response?.id) {
        previousResponseId = (<any>event).response.id;
      }
      switch (event.type) {
        case 'response.output_text.delta': {
          messageDeltaCallback(event.delta);
          break;
        }
        case 'response.output_item.added': {
          if (event.item.type === 'function_call') {
            currentFunctionName = event.item.name;
            currentFunctionCallId = event.item.call_id;
            messageDeltaCallback('\n\n```py\n');
          }
          break;
        }
        case 'response.function_call_arguments.delta': {
          currentScript += event.delta;
          messageDeltaCallback(event.delta);
          break;
        }
        case 'response.function_call_arguments.done': {
          if (enableCodeInterpreter && runScriptCallback) {
            messageDeltaCallback('\n```\n\n');
            const script: ExecutePythonParameters = JSON.parse(currentScript);
            const result = await runScriptCallback(script.script);
            input.push({
              type: 'function_call_output',
              call_id: currentFunctionCallId!,
              output: result,
            })
          }
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  return previousResponseId!;
}
