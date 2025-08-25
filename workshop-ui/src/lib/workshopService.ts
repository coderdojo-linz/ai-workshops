import fs from 'fs';
import { Workshop } from './workshop-schema';
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

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
const blobName = 'workshops.json';

export async function readWorkshops(): Promise<Workshop[]> {
  console.debug('Reading workshops...');
  const blobClient = containerClient.getBlobClient(blobName);

  // Get blob content from position 0 to the end
  // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
  const downloadBlockBlobResponse = await blobClient.download();
  if (downloadBlockBlobResponse.readableStreamBody) {
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    return JSON.parse(downloaded);
  }
  return [];

  // return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export async function writeWorkshops(data: Workshop[]): Promise<boolean> {
  console.debug('Writing workshops...');
  // Create or overwrite the blob
  const content = JSON.stringify(data, null, 2);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const uploadBlobResponse = await blockBlobClient.upload(content, content.length);
  return uploadBlobResponse._response.status === 201;

  // Alternative: write to local file system (for development)
  // const filePath = path.join(process.cwd(), 'data', 'workshops.json');

  // fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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