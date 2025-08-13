import OpenAI, { AzureOpenAI } from 'openai';
import { trace, Span } from '@opentelemetry/api';
import { ExecutePythonParameters, executePythonTool } from './codeExecutionTool';

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: '2025-04-01-preview',
  deployment: 'gpt-4.1',
});

const tracer = trace.getTracer('ai-workshop-chat');

export async function runOpenAI(message: string, instructions: string, 
    previousResponseId: string | undefined, 
    messageDeltaCallback: (delta: string) => void,
    runScriptCallback: (script: string) => Promise<string>): Promise<string> {
  let input: any[] = [{ role: 'user', content: message }];
  while (input.length > 0) {
    const openaiResponse = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5',
      instructions,
      input,
      stream: true,
      store: true,
      reasoning: {
        effort: 'minimal',
      },
      previous_response_id: previousResponseId,
      parallel_tool_calls: false,
      tools: [executePythonTool],
    });

    input = [];
    let currentFunctionName: string | undefined;
    let currentFunctionCallId: string | undefined;
    let currentScript = '';
    
    for await (const event of openaiResponse) {
      switch (event.type) {
        case 'response.created': {
          previousResponseId = event.response.id;
          break;
        }
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
            messageDeltaCallback('\n```\n\n');
            const script: ExecutePythonParameters = JSON.parse(currentScript);
            const result = await runScriptCallback(script.script);
            input.push({
                type: 'function_call_output',
                call_id: currentFunctionCallId!,
                output: result,
            })
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
