'use client'

import { useState, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { chunkMultipleFiles } from '../utils/textChunker'

export default function FolderUpload({ projectId, onAnalysisStart, onAnalysisComplete }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [parsedFiles, setParsedFiles] = useState(null)
  const [readyToBuild, setReadyToBuild] = useState(false)
  const [buildingMap, setBuildingMap] = useState(false)
  const [chunks, setChunks] = useState(null)
  const fileInputRef = useRef(null)

  const handleFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const parseFiles = async (session, files) => {
    try {
      const response = await fetch('/api/files/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ files })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Parse failed');
      }

      const result = await response.json();
      console.log('Parse successful:', result);
      return result;
    } catch (error) {
      console.error('Parse error:', error);
      throw error;
    }
  };

  const downloadFiles = async (session, projectId) => {
    try {
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ projectId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      const result = await response.json();
      console.log('Download successful:', result);
      return result.files;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const handleBuildMap = async () => {
    try {
      setBuildingMap(true);
      setError(null);
      onAnalysisStart?.();
      
      console.log('=== Starting Map Building Process ===');
      console.log(`Total files to process: ${parsedFiles.length}`);
      console.log('Files to be processed:', parsedFiles.map(f => ({
        filename: f.filename,
        language: f.language,
        size: f.text?.length || 0,
        success: f.success
      })));
      
      // Step 1: Chunk the files
      const fileChunks = await chunkMultipleFiles(parsedFiles);
      setChunks(fileChunks);
      
      // Log chunk distribution
      const chunksByFile = fileChunks.reduce((acc, chunk) => {
        const filename = chunk.metadata.filename;
        acc[filename] = (acc[filename] || 0) + 1;
        return acc;
      }, {});

      console.log('\n=== Chunking Results ===');
      console.log('Chunks per file:');
      Object.entries(chunksByFile)
        .sort((a, b) => b[1] - a[1])
        .forEach(([filename, count]) => {
          console.log(`${filename}: ${count} chunks`);
        });
      console.log(`Total chunks created: ${fileChunks.length}`);

      // Step 2: Analyze files
      console.log('\n=== Starting File Analysis ===');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        const response = await fetch('/api/files/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            projectId,
            files: parsedFiles,
            chunks: fileChunks
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Analysis failed');
        }

        const analysisResult = await response.json();
        console.log('Analysis complete:', analysisResult);
        onAnalysisComplete?.(analysisResult.analysis.analysis_data);
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('Analysis timed out. Please try again with fewer files.');
        }
        throw err;
      } finally {
        clearTimeout(timeoutId);
      }
      
    } catch (err) {
      console.error('Error building map:', err);
      setError(err.message);
      onAnalysisComplete?.(); // Ensure we complete even on error
    } finally {
      setBuildingMap(false);
    }
  };

  const handleRetry = async () => {
    setError(null);
    await handleBuildMap();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    setError(null)
    setReadyToBuild(false)
    setParsedFiles(null)
    setChunks(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Create FormData with files
      const formData = new FormData()
      formData.append('projectId', projectId)
      files.forEach(file => {
        formData.append('files', file)
      })

      // Upload files (0-50%)
      setProgress(0)
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      setProgress(50)

      // Download files (50-75%)
      const downloadedFiles = await downloadFiles(session, projectId)
      console.log('Files downloaded:', downloadedFiles)
      setProgress(75)

      // Parse files (75-100%)
      const parseResult = await parseFiles(session, downloadedFiles)
      setParsedFiles(parseResult.files)
      setProgress(100)
      
      if (parseResult.successfulParses > 0) {
        setReadyToBuild(true)
      }
    } catch (err) {
      console.error('Process error:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-[#1A1B26] rounded-lg p-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[#EAEAEA] mb-4">
          Upload Folder
        </h3>
        
        <div className="mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
          />
          
          <div 
            onClick={handleFolderSelect}
            className={`
              cursor-pointer 
              border-2 border-dashed border-[#3A3D56] 
              rounded-lg p-8 
              transition-all duration-300 ease-in-out
              ${uploading || buildingMap ? 
                'opacity-50 cursor-not-allowed' : 
                'hover:border-[#4CAF50] hover:bg-[#1E1E2E] group'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-4">
              <svg 
                className="w-12 h-12 text-[#3A3D56] group-hover:text-[#4CAF50] transition-colors duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <div className="text-[#EAEAEA] group-hover:text-[#4CAF50] transition-colors duration-300">
                <p className="text-lg font-medium">
                  {uploading ? 'Processing...' : 'Click to Select Folder'}
                </p>
                <p className="text-sm text-[#3A3D56] mt-1">
                  Upload your project files
                </p>
              </div>
            </div>
          </div>
        </div>

        {uploading && (
          <div className="mt-6">
            <div className="w-full bg-[#1E1E2E] rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-[#4CAF50] h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-[#EAEAEA] mt-2">
              {progress <= 50 ? 'Uploading...' : 
               progress <= 75 ? 'Processing...' : 
               'Analyzing...'} {progress}%
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 text-sm text-[#EAEAEA] bg-red-500/10 border border-red-500/20 rounded-md p-3">
            {error}
          </div>
        )}

        {readyToBuild && (
          <div className="mt-6">
            <p className="text-[#4CAF50] font-medium mb-4">
              Ready to Build Map
            </p>
            <button
              onClick={handleBuildMap}
              disabled={buildingMap}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[#EAEAEA] bg-[#3A3D56] hover:bg-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50] disabled:opacity-50 transition-colors duration-300"
            >
              {buildingMap ? 'Processing...' : 'Build Map'}
            </button>
            
            {chunks && (
              <div className="mt-4 text-sm text-[#EAEAEA]">
                Successfully created {chunks.length} chunks from your files
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
