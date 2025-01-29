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

const analyzeFile = async (file, chunks) => {
  try {
    console.log(`\n=== Analyzing file: ${file.filename} ===`);
    
    const model = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.2,
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
    const BATCH_SIZE = 10;
    const fileAnalyses = [];
    
    for (let i = 0; i < uniqueFiles.length; i += BATCH_SIZE) {
      console.log(`\nProcessing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(uniqueFiles.length/BATCH_SIZE)}`);
      
      const batch = uniqueFiles.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(file => {
        if (!file.success) {
          console.log(`Skipping ${file.filename} - parsing was not successful`);
          return null;
        }
        
        const fileChunks = chunksByFile[file.filename] || [];
        if (fileChunks.length === 0) {
          console.log(`Skipping ${file.filename} - no chunks found`);
          return null;
        }
        
        return analyzeFile(file, fileChunks)
          .then(analysis => ({
            fileId: file.id,
            filename: file.filename,
            analysis
          }))
          .catch(error => {
            console.error(`Error analyzing ${file.filename}:`, error);
            return null;
          });
      });
      
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null);
      fileAnalyses.push(...validResults);
      
      console.log(`Completed batch with ${validResults.length} successful analyses`);
    }

    // Create project-level analysis
    const projectAnalysis = {
      totalFiles: uniqueFiles.length,
      analyzedFiles: fileAnalyses.length,
      files: fileAnalyses,
      relationships: generateFileRelationships(fileAnalyses),
      timestamp: new Date().toISOString(),
    };

    console.log('\n====== Analysis Summary ======');
    console.log(`Total unique files: ${uniqueFiles.length}`);
    console.log(`Successfully analyzed files: ${fileAnalyses.length}`);
    console.log(`Skipped/failed files: ${uniqueFiles.length - fileAnalyses.length}`);

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
