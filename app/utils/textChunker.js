import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

/**
 * Chunks the text content from a file into smaller pieces for LLM processing
 * @param {Object} file - The file object containing text content and metadata
 * @param {number} chunkSize - The size of each chunk (default: 1000)
 * @param {number} chunkOverlap - The overlap between chunks (default: 200)
 * @returns {Array} Array of document chunks with metadata
 */
export const chunkFileContent = async (file, chunkSize = 1000, chunkOverlap = 200) => {
  try {
    console.log(`\n=== Chunking file: ${file.filename} ===`);
    console.log(`Language: ${file.language}`);
    console.log(`Text size: ${file.text.length} characters`);
    console.log(`Chunk settings: size=${chunkSize}, overlap=${chunkOverlap}`);
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    // Create a document with the file's text content and metadata
    const doc = new Document({ 
      pageContent: file.text,
      metadata: {
        filename: file.filename,
        language: file.language,
        type: file.type,
        fileId: file.id,
        stats: file.stats
      }
    });

    // Split the document into chunks
    const chunks = await splitter.splitDocuments([doc]);
    
    // Calculate chunk statistics
    const chunkSizes = chunks.map(c => c.pageContent.length);
    const avgSize = Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunks.length);
    const minSize = Math.min(...chunkSizes);
    const maxSize = Math.max(...chunkSizes);
    
    console.log('\n=== Chunk Statistics ===');
    console.log(`Number of chunks: ${chunks.length}`);
    console.log(`Average chunk size: ${avgSize} characters`);
    console.log(`Min chunk size: ${minSize} characters`);
    console.log(`Max chunk size: ${maxSize} characters`);
    
    // Add chunk index to each chunk's metadata
    const chunksWithIndex = chunks.map((chunk, index) => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        chunkIndex: index,
        totalChunks: chunks.length
      }
    }));

    return chunksWithIndex;
  } catch (error) {
    console.error(`Error chunking ${file.filename}:`, error);
    throw error;
  }
};

/**
 * Process multiple files and chunk their content
 * @param {Array} files - Array of files with text content
 * @returns {Array} Array of all chunks from all files
 */
export const chunkMultipleFiles = async (files) => {
  try {
    console.log(`\n====== Starting to chunk ${files.length} files ======`);
    console.log('Files to process:', files.map(f => f.filename).join(', '));
    
    const allChunks = [];
    let totalChunks = 0;
    let processedFiles = 0;
    let skippedFiles = 0;
    
    // Process each file
    for (const file of files) {
      if (!file.success || !file.text) {
        console.log(`⚠️ Skipping ${file.filename} - no valid text content`);
        skippedFiles++;
        continue;
      }
      
      const fileChunks = await chunkFileContent(file);
      allChunks.push(...fileChunks);
      totalChunks += fileChunks.length;
      processedFiles++;
      
      // Log progress
      console.log(`Progress: ${processedFiles}/${files.length} files processed`);
    }
    
    // Log final summary
    console.log('\n====== Chunking Summary ======');
    console.log(`Total files processed: ${processedFiles}`);
    console.log(`Files skipped: ${skippedFiles}`);
    console.log(`Total chunks created: ${totalChunks}`);
    console.log(`Average chunks per file: ${Math.round(totalChunks / processedFiles)}`);
    
    return allChunks;
  } catch (error) {
    console.error('Chunking error:', error);
    throw error;
  }
};
