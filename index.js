const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require('@azure/identity');
const { v1: uuidv1 } = require("uuid");
require("dotenv").config();

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) throw Error('Azure Storage accountName not found');

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );

async function main() {
  try {
    console.log("Azure Blob storage v12 - Applist");
    
  let clientContainer = blobServiceClient.getContainerClient(process.env.CONTAINER)
  //listBlobs(clientContainer)
 // .catch((ex) => console.log(ex.message));

  downloadBlob(clientContainer, process.env.BLOBNAME)
  .catch((ex) => console.log(ex.message));

  } catch (err) {
    console.err(`Error: ${err.message}`);
  }
}

main()
  .then(() => console.log("Done"))
  .catch((ex) => console.log(ex.message));

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
}

async function downloadBlob(clientContainer, blobName){
  const downloadBlockBlobResponse = await clientContainer.getBlockBlobClient(blobName).download(0);
  console.log('\nDownloaded blob content...');
console.log(
  '\t',
  await streamToText(downloadBlockBlobResponse.readableStreamBody)
);
}

// Convert stream to text
async function streamToText(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  return data;
}