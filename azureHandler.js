var { BlobServiceClient } = require("@azure/storage-blob");
//var { DefaultAzureCredential } = require('@azure/identity');
//import { uuidv1 } from "uuid";
require ('dotenv/config');

let listOfApps = {};

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    if (!accountName) throw Error('Azure Storage accountName not found');

const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
);

let clientContainer = blobServiceClient.getContainerClient(process.env.CONTAINER)

const init = () => {
  try {
    console.log("Azure Blob storage v12 - Applist");
    return downloadBlob(clientContainer, process.env.BLOBNAME)
    .catch((ex) => console.log(ex.message));

  } catch (err) {
    console.err(`Error: ${err.message}`);
  }
}

async function downloadBlob(){
  const downloadBlockBlobResponse = await clientContainer.getBlockBlobClient(process.env.BLOBNAME).download(0);
  console.log('\nDownloaded blob content...');
  return await streamToText(downloadBlockBlobResponse.readableStreamBody);
}

const uploadBlob = async (Applist) => {
  try {
  const blockBlobClient = clientContainer.getBlockBlobClient(process.env.BLOBNAME);
  const contentLength = Buffer.byteLength(JSON.stringify(Applist, undefined, 2), 'utf8');
  const options = { blobHTTPHeaders: { blobContentType: 'application/json' } };
  const uploadResponse = await blockBlobClient.upload(JSON.stringify(Applist, undefined, 2), contentLength, options);
  console.log("done");
  }catch (error){
    console.error(error);
  }
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

module.exports = {
  init: init,
  uploadBlob: uploadBlob
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
