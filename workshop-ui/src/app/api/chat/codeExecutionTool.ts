import { z } from 'zod/v4';
import { FunctionTool } from 'openai/resources/responses/responses.mjs';
import { DynamicSession } from '@/lib/dynamicSession';

export const executePythonParameters = z.object({
  script: z.string().describe('The python script to execute'),
});

export type ExecutePythonParameters = z.infer<typeof executePythonParameters>;

export type ExecutePythonOutput = {
  status: 'NotStarted' | 'Running' | 'Succeeded' | 'Failed' | 'Cancelled';
  stdout: string;
  stderr: string;
  executionResult: string;
};

export const executePythonTool: FunctionTool = {
  type: 'function',
  name: 'execute_python',
  description: 'Executes a given python script and returns its stdout output',
  parameters: z.toJSONSchema(executePythonParameters),
  strict: true,
};

export async function executePython(parameters: ExecutePythonParameters, filePaths: string[], instanceId?: string) {
  var dynamicSession = new DynamicSession(instanceId);

  const result = await dynamicSession.executeScript(parameters.script, filePaths);
  return result;
}
