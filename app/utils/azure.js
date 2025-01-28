import { BlobServiceClient } from '@azure/storage-blob';

// Initialize Azure Blob Service Client
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

// Get container client
const containerClient = blobServiceClient.getContainerClient('project-files');

export const uploadToBlob = async (projectId, filePath, buffer, contentType) => {
  try {
    console.log(` Uploading ${filePath} to Azure Blob Storage...`);
    
    // Generate blob name (includes project ID and maintains folder structure)
    const blobName = `${projectId}/${filePath}`;
    console.log('Blob name:', blobName);
    
    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Get file size
    const fileSize = buffer.length;
    console.log('File size:', fileSize, 'bytes');

    // Upload content with content length
    const options = {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    };
    
    await blockBlobClient.uploadData(buffer, options);
    
    console.log(' Upload successful');
    // Return the URL
    return blockBlobClient.url;
  } catch (error) {
    console.error(' Azure upload error:', error);
    throw error;
  }
};

export const deleteFromBlob = async (projectId) => {
  try {
    console.log(`Deleting blobs for project ${projectId}...`);
    
    // List all blobs with the project prefix
    const iterator = containerClient.listBlobsFlat({
      prefix: `${projectId}/`
    });
    
    // Delete each blob
    for await (const blob of iterator) {
      await containerClient.deleteBlob(blob.name);
      console.log(`Deleted blob: ${blob.name}`);
    }
    
    console.log('Project blobs deleted successfully');
  } catch (error) {
    console.error('Azure delete error:', error);
    throw error;
  }
};

export const downloadFromBlob = async (blobUrl) => {
  try {
    console.log(`Starting download from blob URL: ${blobUrl}`);
    
    // Extract blob name from URL
    const url = new URL(blobUrl);
    const blobName = url.pathname.split('/').slice(2).join('/');
    console.log(`Extracted blob name: ${blobName}`);
    
    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log(`Created block blob client for: ${blobName}`);
    
    // Download blob content
    console.log('Initiating download...');
    const downloadResponse = await blockBlobClient.download();
    console.log('Download response received');
    
    // Convert stream to buffer
    const chunks = [];
    let totalSize = 0;
    
    console.log('Starting to read stream chunks...');
    // Use the browser's stream API
    for await (const chunk of downloadResponse.readableStreamBody) {
      const buffer = Buffer.from(chunk);
      totalSize += buffer.length;
      chunks.push(buffer);
      console.log(`Read chunk of size: ${buffer.length} bytes. Total size so far: ${totalSize} bytes`);
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`Download complete. Final buffer size: ${buffer.length} bytes`);
    return buffer;
    
  } catch (error) {
    console.error('Azure download error:', error);
    throw error;
  }
};
