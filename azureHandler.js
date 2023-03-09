import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from '@azure/identity';
//import { uuidv1 } from "uuid";
import {} from 'dotenv/config';

let listOfApps = {};

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) throw Error('Azure Storage accountName not found');

const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
);

let clientContainer = blobServiceClient.getContainerClient(process.env.CONTAINER)

export default async function init() {
  try {
    console.log("Azure Blob storage v12 - Applist");

 return await downloadBlob(clientContainer, process.env.BLOBNAME)
  .catch((ex) => console.log(ex.message));

  } catch (err) {
    console.err(`Error: ${err.message}`);
  }
}

/*
async function listBlobs(clientContainer){

  console.log('\nListing blobs...');

// List the blob(s) in the container.
for await (const blob of clientContainer.listBlobsFlat()) {
  // Get Blob Client from name, to get the URL
  const tempBlockBlobClient = clientContainer.getBlockBlobClient(blob.name);

  // Display blob name and URL
  console.log(
    `\n\tname: ${blob.name}\n\tURL: ${tempBlockBlobClient.url}\n`
  );
}
}*/

async function downloadBlob(clientContainer, blobName){
  const downloadBlockBlobResponse = await clientContainer.getBlockBlobClient(blobName).download(0);
  console.log('\nDownloaded blob content...');
  return await streamToText(downloadBlockBlobResponse.readableStreamBody);
 /*console.log(
  '\t',
  await streamToText(downloadBlockBlobResponse.readableStreamBody)
);*/
}

// Convert stream to text
// helper to downloadBlob
async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  listOfApps = JSON.parse(data);
  return listOfApps;
}