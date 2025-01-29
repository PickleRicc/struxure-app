import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const TEMPLATE_TEXT = `Analyze the following file content and provide a structured analysis.
Filename: {filename}
Language: {language}
Content: {content}

You must respond with a valid JSON object in exactly this format:
{format}

Focus on identifying file relationships and dependencies. Be thorough in analyzing imports and file references.
Ensure your response is a valid JSON object that exactly matches the format above.`;

const JSON_FORMAT = `{
  "fileDescription": "Brief description of what this file does",
  "mainPurpose": "The primary purpose/functionality of this file",
  "dependencies": {
    "imports": ["List of imported packages/modules"],
    "referencedFiles": ["List of other files referenced or used"],
    "externalDependencies": ["List of external services or APIs used"]
  },
  "keyFunctionality": ["List of key functions or features"],
  "technicalDetails": {
    "language": "Programming language",
    "framework": "Framework if applicable",
    "type": "Type of file (e.g., component, utility, route)"
  }
}`;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 8000; // 8 seconds

/**
 * Sleep for a specified duration
 * @param {number} ms - Duration in milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param {number} retryCount - Current retry attempt
 * @returns {number} Delay in milliseconds
 */
const getRetryDelay = (retryCount) => {
  const delay = Math.min(
    INITIAL_RETRY_DELAY * Math.pow(2, retryCount),
    MAX_RETRY_DELAY
  );
  return delay + Math.random() * 1000; // Add jitter
};

const analyzeFile = async (file, chunks, retryCount = 0) => {
  try {
    console.log(`\n=== Analyzing file: ${file.filename} ===`);
    
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.2,
      timeout: 60000, // 60 second timeout
    });

    const prompt = new PromptTemplate({
      template: TEMPLATE_TEXT,
      inputVariables: ["filename", "language", "content"],
      partialVariables: { format: JSON_FORMAT }
    });

    // Combine all chunks' content for full file analysis
    const fullContent = chunks
      .sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex)
      .map(chunk => chunk.pageContent)
      .join('\n');

    const formattedPrompt = await prompt.format({
      filename: file.filename,
      language: file.language,
      content: fullContent,
    });

    const response = await model.invoke(formattedPrompt);
    const parsedResponse = JSON.parse(response.content);

    console.log(`Analysis complete for ${file.filename}`);
    return parsedResponse;
  } catch (error) {
    console.error(`Error analyzing ${file.filename}:`, error);
    
    // Retry logic for recoverable errors
    if (retryCount < MAX_RETRIES && (
      error.message.includes('timeout') ||
      error.message.includes('rate limit') ||
      error.message.includes('network') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('500') ||
      error.message.includes('503')
    )) {
      const delay = getRetryDelay(retryCount);
      console.log(`Retrying analysis for ${file.filename} in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return analyzeFile(file, chunks, retryCount + 1);
    }
    
    throw error;
  }
};

export const analyzeProject = async (files, chunks) => {
  try {
    console.log('\n====== Starting Project Analysis ======');
    
    // Deduplicate files
    const uniqueFiles = Array.from(new Map(files.map(file => [file.filename, file])).values());
    console.log(`Original files count: ${files.length}`);
    console.log(`Unique files count: ${uniqueFiles.length}`);
    
    // Group chunks by filename for faster lookup
    const chunksByFile = chunks.reduce((acc, chunk) => {
      const filename = chunk.metadata.filename;
      if (!acc[filename]) acc[filename] = [];
      acc[filename].push(chunk);
      return acc;
    }, {});

    // Process files in parallel batches
    const BATCH_SIZE = 15;
    const fileAnalyses = [];
    const skippedFiles = [];
    
    for (let i = 0; i < uniqueFiles.length; i += BATCH_SIZE) {
      console.log(`\nProcessing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(uniqueFiles.length/BATCH_SIZE)}`);
      
      const batch = uniqueFiles.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(file => {
        if (!file.success) {
          console.log(`Skipping ${file.filename} - parsing was not successful`);
          skippedFiles.push({
            filename: file.filename,
            reason: 'parsing_failed'
          });
          return null;
        }
        
        const fileChunks = chunksByFile[file.filename] || [];
        if (fileChunks.length === 0) {
          console.log(`Skipping ${file.filename} - no chunks found`);
          skippedFiles.push({
            filename: file.filename,
            reason: 'no_chunks'
          });
          return null;
        }
        
        return analyzeFile(file, fileChunks)
          .then(analysis => ({
            filename: file.filename,
            analysis
          }))
          .catch(error => {
            console.error(`Failed to analyze ${file.filename}:`, error);
            skippedFiles.push({
              filename: file.filename,
              reason: 'analysis_failed',
              error: error.message
            });
            return null;
          });
      });
      
      const batchResults = await Promise.all(batchPromises);
      fileAnalyses.push(...batchResults.filter(Boolean));
      
      // Log batch completion
      console.log(`Completed batch ${Math.floor(i/BATCH_SIZE) + 1}`);
      console.log(`Processed ${fileAnalyses.length} files so far`);
    }
    
    console.log('\n====== Analysis Summary ======');
    console.log(`Successfully analyzed ${fileAnalyses.length} files`);
    console.log(`Skipped/failed files: ${skippedFiles.length}`);

    // Create project-level analysis with metadata
    const projectAnalysis = {
      summary: {
        totalFiles: uniqueFiles.length,
        analyzedFiles: fileAnalyses.length,
        skippedFiles: skippedFiles.length
      },
      files: fileAnalyses.reduce((acc, file) => {
        acc[file.filename] = file.analysis;
        return acc;
      }, {}),
      skippedFiles: skippedFiles.reduce((acc, file) => {
        acc[file.filename] = {
          reason: file.reason,
          error: file.error
        };
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };
    
    return projectAnalysis;
  } catch (error) {
    console.error('Project analysis error:', error);
    throw error;
  }
};

const generateFileRelationships = (fileAnalyses) => {
  const relationships = [];

  fileAnalyses.forEach(file => {
    const { filename, analysis } = file;
    const referencedFiles = analysis.dependencies.referencedFiles || [];

    referencedFiles.forEach(referencedFile => {
      relationships.push({
        sourceFile: filename,
        targetFile: referencedFile,
        type: 'references',
      });
    });
  });

  return relationships;
};
