import fs from 'fs';
import { AccessToken, DefaultAzureCredential } from '@azure/identity';
import path from 'path';

type PagedSessionResourceFile = {
  nextLink?: string;
  value: SessionResourceFile[];
};

type SessionResourceFile = {
  contentType: string;
  lastModifiedAt: string;
  name: string;
  sizeInBytes: number;
  type: string;
};

export type ImageExecutionResult = {
  type: string;
  format: string;
  base64_data: string;
};

type SessionCodeExecutionResult = {
  id: string;
  status: 'NotStarted' | 'Running' | 'Succeeded' | 'Failed' | 'Cancelled';
  result: {
    stdout: string;
    stderr: string;
    executionTimeInMilliseconds: number;
    executionResult?: any;
  };
};

export class DynamicSession {
  private sessionId: string;
  private accessToken?: AccessToken;

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? crypto.randomUUID();
  }

  public async executeScript(script: string, filePaths: string[]): Promise<SessionCodeExecutionResult> {
    if (filePaths.length > 0) {
      await this.uploadFiles(filePaths);
    }

    const accessToken = await this.getAccessToken();

    const execResult = await fetch(`${process.env.AZURE_SESSION_POOL_ENDPOINT!}/executions?api-version=2025-02-02-preview&identifier=${this.sessionId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: script,
        executionType: 'Synchronous',
        codeInputType: 'Inline',
        timeoutInSeconds: 60,
      }),
    });

    if (execResult.status !== 200) {
      throw new Error(`Failed to execute script: ${execResult.statusText}`, {
        cause: await execResult.text(),
      });
    }

    return execResult.json();
  }

  private async uploadFiles(filePaths: string[]) {
    const existingFiles = await this.getExistingFiles();
    const filesToUpload = filePaths.filter((filePath) => !existingFiles.includes(filePath));
    if (filesToUpload.length === 0) {
      return;
    }

    const accessToken = await this.getAccessToken();

    const formData = new FormData();
    for (const filePath of filePaths) {
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer], { type: 'text/csv' });
      const fileName = path.basename(filePath);
      formData.append('file', blob, fileName);
    }

    const url = this.buildUrl('files');
    const fileUploadResult = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
      },
      body: formData,
    });

    if (fileUploadResult.status !== 200) {
      const errorInfo = await fileUploadResult.text();
      throw new Error(`Failed to upload files: ${fileUploadResult.statusText}`, { cause: errorInfo });
    }
  }

  public async getExistingFiles() {
    const accessToken = await this.getAccessToken();
    async function fetchFiles(url: string): Promise<PagedSessionResourceFile> {
      let fileListResult = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
        },
      });

      if (fileListResult.status !== 200) {
        throw new Error(`Failed to get file list: ${fileListResult.statusText}`, {
          cause: await fileListResult.text(),
        });
      }

      return fileListResult.json();
    }

    const existingFiles: string[] = [];
    let fileListResponse = await fetchFiles(this.buildUrl('files'));
    while (true) {
      existingFiles.push(...fileListResponse.value.map((file) => file.name));

      if (fileListResponse.nextLink) {
        fileListResponse = await fetchFiles(fileListResponse.nextLink);
      } else {
        break;
      }
    }

    return existingFiles;
  }

  public async getFileContent(fileName: string): Promise<ArrayBuffer> {
    const accessToken = await this.getAccessToken();
    const fileContentResponse = await fetch(this.buildUrl(`files/${fileName}/content`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
      },
    });

    if (fileContentResponse.status !== 200) {
      throw new Error(`Failed to get file content: ${fileContentResponse.statusText}`, {
        cause: await fileContentResponse.text(),
      });
    }

    return await fileContentResponse.arrayBuffer();
  }

  private buildUrl(path: string) {
    return `${process.env.AZURE_SESSION_POOL_ENDPOINT!}/${path}?api-version=2025-02-02-preview&identifier=${this.sessionId}`;
  }

  private async getAccessToken() {
    if (this.accessToken) {
      // Check if token will be valid for another 5 seconds
      if (this.accessToken.expiresOnTimestamp - Date.now() > 5000) {
        return this.accessToken;
      }
    }

    const credential = new DefaultAzureCredential();
    this.accessToken = await credential.getToken('https://dynamicsessions.io');
    return this.accessToken;
  }
}
