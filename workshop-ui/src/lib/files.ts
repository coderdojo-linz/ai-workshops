import OpenAI from 'openai';

declare module "openai" {
    export namespace OpenAI {
        export interface Files {
            getFileId(fileName: string, purpose?: string): Promise<string>;
        }
    }
}

OpenAI.Files.prototype.getFileId = async function (fileName: string, purpose: string = 'user_data'): Promise<string> {
  for await (const file of this.list({ purpose })) {
    if (file?.filename === fileName) {
      return file.id;
    }
  }

  return '';
}
