import fs from "fs";
import { z } from "zod/v4";
import { FunctionTool } from "openai/resources/responses/responses.mjs";
import { DefaultAzureCredential } from "@azure/identity";

export const executePythonParameters = z.object({
  script: z.string().describe("The python script to execute"),
});

export type ExecutePythonParameters = z.infer<typeof executePythonParameters>;

export type ExecutePythonOutput = {
  status: "NotStarted" | "Running" | "Succeeded" | "Failed" | "Cancelled";
  stdout: string;
  stderr: string;
  files?: string[];
};

export const executePythonTool: FunctionTool = {
  type: "function",
  name: "execute_python",
  description: "Executes a given python script and returns its stdout output",
  parameters: z.toJSONSchema(executePythonParameters),
  strict: true,
};

type SessionCodeExecutionResult = {
  id: string;
  status: "NotStarted" | "Running" | "Succeeded" | "Failed" | "Cancelled";
  result: {
    stdout: string;
    stderr: string;
    executionTimeInMilliseconds: number;
  };
};

export async function executePython(
  parameters: ExecutePythonParameters
): Promise<ExecutePythonOutput> {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://dynamicsessions.io");

  const sessionId = crypto.randomUUID();

  /*
  const sessionResult = await fetch(
    `${process.env
      .AZURE_SESSION_POOL_ENDPOINT!}/session?api-version=2025-02-02-preview&identifier=${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    }
  );

  if (sessionResult.status !== 200) {
    return {
      status: "Failed",
      stdout: "",
      stderr: "Could not create session",
    };
  }
    */

  const formData = new FormData();
  const fileBuffer = fs.readFileSync("data-cave.csv");
  const blob = new Blob([fileBuffer], { type: "text/csv" });
  formData.append("file", blob, "data-cave.csv");
  const fileUploadResult = await fetch(
    `${process.env
      .AZURE_SESSION_POOL_ENDPOINT!}/files?api-version=2025-02-02-preview&identifier=${sessionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
      body: formData,
    }
  );

  console.log(await fileUploadResult.json());
  if (fileUploadResult.status !== 200) {
    return {
      status: "Failed",
      stdout: "",
      stderr: "Could not upload file to session",
    };
  }

  const result = await fetch(
    `${process.env
      .AZURE_SESSION_POOL_ENDPOINT!}/executions?api-version=2025-02-02-preview&identifier=${sessionId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: parameters.script,
        executionType: "Synchronous",
        codeInputType: "Inline",
        timeoutInSeconds: 60,
      }),
    }
  );
  const data: SessionCodeExecutionResult = await result.json();

  // Get list of files in the session
  const filesResult = await fetch(
    `${process.env
      .AZURE_SESSION_POOL_ENDPOINT!}/files?api-version=2025-02-02-preview&identifier=${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    }
  );
  
  const filesData = await filesResult.json();

  // Download plot.png
  const plotDownloadResult = await fetch(
    `${process.env
      .AZURE_SESSION_POOL_ENDPOINT!}/files/plot.png/content/?api-version=2025-02-02-preview&identifier=${sessionId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.token}`,
      },
    }
  );
  
  if (plotDownloadResult.ok) {
    const plotBuffer = await plotDownloadResult.arrayBuffer();
    fs.writeFileSync('plot.png', Buffer.from(plotBuffer), { flag: 'w' });
    console.log('Downloaded and saved plot.png to local directory');
  } else {
    console.log('Failed to download plot.png:', plotDownloadResult.status);
  }
  
  return {
    status: data.status,
    stdout: data.result.stdout,
    stderr: data.result.stderr,
    files: filesData.value.map((file: any) => file.name),
  };
}
