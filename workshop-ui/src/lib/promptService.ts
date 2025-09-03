import { runOpenAI } from '@/app/api/chat/openaiRunner';
import { Prompt } from './prompt-schema';
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";

// Enter your storage account name
const account = process.env.STORAGE_ACCOUNT || "";
if (!account) {
  throw Error("Azure Storage account name not found");
}
const defaultAzureCredential = new DefaultAzureCredential();

const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  defaultAzureCredential,
);

const containerName = "ai-workshop";
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function readPrompt(id: string): Promise<Prompt> {
  console.debug('Reading prompts...');
  const blobClient = containerClient.getBlobClient(`system-prompts/${id}.md`);

  // Get blob content from position 0 to the end
  // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
  const downloadBlockBlobResponse = await blobClient.download();
  if (downloadBlockBlobResponse.readableStreamBody) {
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    return JSON.parse(downloaded);
  }
  return {} as Prompt;
}

export async function listPrompts(): Promise<string[]> {
  console.debug('Listing prompts...');
  const promptIds: string[] = [];
  // List the blob(s) in the container.
  for await (const blob of containerClient.listBlobsFlat({ prefix: 'system-prompts/' })) {
    const id = blob.name.replace('system-prompts/', '').replace('.md', '');
    promptIds.push(id);
  }
  return promptIds;
}

export async function getAllPrompts(): Promise<Prompt[]> {
  const promptIds = await listPrompts();
  const prompts = await Promise.all(promptIds.map(id => readPrompt(id)));
  return prompts;
}

export async function writePrompts(data: Prompt, id: string): Promise<boolean> {
  console.debug('Writing prompts...');
  const blobClient = containerClient.getBlockBlobClient(`system-prompts/${id}.md`);
  // Create or overwrite the blob
  const content = JSON.stringify(data, null, 2);
  const uploadBlobResponse = await blobClient.upload(content, content.length);
  return uploadBlobResponse._response.status === 201;
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const result = await new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (data) => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });
    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    stream.on("error", reject);
  });
  return result.toString();
}


export async function savePromptToBlobStorage(prompt: string): Promise<{ id: string | null }> {
  try {
    const title = 'untitled';
    const description = 'No description';

    // Create a unique filename using the title and current timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}_${timestamp}.md`;

    if (await writePrompts(
      { id: fileName, title, description, content: prompt, createdAt: new Date().toISOString() } as Prompt, fileName
    )) {
      return { id: fileName };
    } else {
      throw new Error("Failed to upload prompt to Blob Storage");
    }
  } catch (error) {
    console.error("Error saving prompt to Blob Storage:", error);
    return { id: null };
  }
}

export async function generateMetadata(id: string): Promise<boolean> {
  try {
    const promptData = await readPrompt(id);
    const prompt = promptData.content;
    if (!prompt) {
      return false;
    }
    let responseString = "";

    // Ask the AI to generate title and description
    await runOpenAI(
      `Generate a short title (max 5 words), a maximum of 5 tags and a one sentence description for the following prompt. Return the result as a JSON object with "title", "description" and "tags" properties. Prompt: ${prompt}`,
      "You are an AI assistant that helps generate titles, descriptions and tags for prompts. You always respond in JSON format.",
      undefined,
      (response) => responseString += response
    );
    console.log("AI response for prompt metadata:", responseString);
    const response = JSON.parse(responseString);
    const title = response.title || 'untitled';
    const description = response.description || 'No description';
    const tags = response.tags || [];

    // Update the prompt data with new metadata
    promptData.title = title;
    promptData.description = description;
    promptData.tags = tags;

    // Save the updated prompt data back to Blob Storage
    await writePrompts(promptData, id);
    console.log(`Metadata generated and saved for prompt ${id}`);
    return true;
  } catch (error) {
    console.error("Error generating metadata:", error);
    return false;
  }
}
