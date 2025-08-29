import { z } from 'zod/v4';
import { FunctionTool } from 'openai/resources/responses/responses.mjs';
import { DynamicSession } from '@/lib/dynamicSession';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const blobServiceClient = new BlobServiceClient(`https://${process.env.STORAGE_ACCOUNT!}.blob.core.windows.net`, new DefaultAzureCredential());

export const executePythonParameters = z.object({
  script: z.string().describe(`The python script to execute.`),
});

export type ExecutePythonParameters = z.infer<typeof executePythonParameters>;

export type ExecutePythonOutput = {
  status: 'NotStarted' | 'Running' | 'Succeeded' | 'Failed' | 'Cancelled';
  stdout: string;
  stderr: string;
  executionResult: string;
};

export type ResultFile = {
  fileName: string;
  targetFileName: string;
  url: string;
  originalFileName: string;
};

export const executePythonTool: FunctionTool = {
  type: 'function',
  name: 'execute_python',
  description: `Runs arbitrary Python code, return what it prints, and returns links to any files it produced.
The function takes a Python script, runs it, and captures all output that would normally go to the console
(both stdout and stderr will be returned in separate fields). If the script generates files 
(e.g. a PNG chart from matplotlib, a CSV export, etc.), it MUST save them into /mnt/data.
Any files written there will be automatically exposed to the caller through public URLs, which the function 
will return alongside the script output.`,
  parameters: z.toJSONSchema(executePythonParameters),
  strict: true,
};

export async function executePython(script: string, filePaths: string[], instanceId?: string) {
  var dynamicSession = new DynamicSession(instanceId);

  const result = await dynamicSession.executeScript(script, filePaths);
  const resultFiles: ResultFile[] = (await dynamicSession.getExistingFiles())
    .filter(f => !filePaths.map(fp => fp.split('/').pop()).includes(f))
    .map(f => {
      const splitted = f.split('.');
      const extension = splitted.pop();
      const fileName = splitted.join('.');
      return { 
        fileName, 
        targetFileName: `${fileName}-${crypto.randomUUID()}.${extension}`,
        url: '',
        originalFileName: f,
      }
    });

    const containerClient = blobServiceClient.getContainerClient('ai-workshop');
  for (const resultFile of resultFiles) {
    const blockBlobClient = containerClient.getBlockBlobClient(resultFile.targetFileName);
    const fileContent = await dynamicSession.getFileContent(resultFile.originalFileName);
    await blockBlobClient.upload(fileContent, fileContent.byteLength);
    resultFile.url = blockBlobClient.url;
  }

  return {
    stdout: result.result.stdout,
    stderr: result.result.stderr,
    resultFiles,
  }
}
