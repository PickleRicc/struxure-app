'use client'

import { useState } from 'react'

export default function TextMap({ analysis }) {
  const [showSkipped, setShowSkipped] = useState(false)
  
  if (!analysis) return null

  // Safely access analysis properties with fallbacks
  const files = analysis?.files || {}
  const skippedFiles = analysis?.skippedFiles || {}
  const summary = analysis?.summary || { totalFiles: 0, analyzedFiles: 0, skippedFiles: 0 }

  const fileEntries = Object.entries(files)
  const skippedEntries = Object.entries(skippedFiles)

  return (
    <div className="w-full p-6 bg-[#1E1E2E] rounded-lg shadow">
      {/* Analysis Summary */}
      <div className="mb-6 p-4 bg-[#121212] rounded-lg">
        <h2 className="text-lg font-semibold text-[#EAEAEA] mb-2">Analysis Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-[#EAEAEA]">Total Files</p>
            <p className="text-[#3A3D56]">{summary.totalFiles}</p>
          </div>
          <div>
            <p className="font-medium text-[#EAEAEA]">Analyzed Files</p>
            <p className="text-[#4CAF50]">{summary.analyzedFiles}</p>
          </div>
          <div>
            <p className="font-medium text-[#EAEAEA]">Skipped Files</p>
            <p className="text-[#3A3D56]">{summary.skippedFiles}</p>
          </div>
        </div>
      </div>

      {/* Toggle Skipped Files */}
      {skippedEntries.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowSkipped(!showSkipped)}
            className="text-sm text-[#4CAF50] hover:text-[#EAEAEA]"
          >
            {showSkipped ? 'Hide' : 'Show'} Skipped Files ({skippedEntries.length})
          </button>
        </div>
      )}

      {/* Skipped Files */}
      {showSkipped && skippedEntries.length > 0 && (
        <div className="mb-6 space-y-4">
          <h3 className="text-lg font-semibold text-[#EAEAEA]">Skipped Files</h3>
          <div className="space-y-3">
            {skippedEntries.map(([filename, info]) => (
              <div key={filename} className="p-3 bg-[#121212] rounded-lg">
                <p className="font-medium text-[#EAEAEA]">{filename}</p>
                <p className="text-sm text-[#3A3D56]">
                  Reason: {info.reason === 'no_chunks' ? 'Binary or empty file' :
                          info.reason === 'parsing_failed' ? 'Failed to parse file' :
                          'Analysis failed'}
                  {info.error && ` - ${info.error}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyzed Files */}
      {fileEntries.length > 0 ? (
        <div className="space-y-6">
          {fileEntries.map(([filename, fileAnalysis]) => (
            <div key={filename} className="border-b border-[#3A3D56] pb-4">
              <h3 className="text-lg font-semibold text-[#EAEAEA] mb-2">
                {filename}
              </h3>
              
              <div className="space-y-3 text-sm">
                <p className="text-[#EAEAEA]"><span className="font-medium">Description:</span> {fileAnalysis?.fileDescription}</p>
                <p className="text-[#EAEAEA]"><span className="font-medium">Main Purpose:</span> {fileAnalysis?.mainPurpose}</p>
                
                <div>
                  <p className="font-medium text-[#EAEAEA] mb-1">Dependencies:</p>
                  <ul className="list-disc pl-5 space-y-1 text-[#EAEAEA]">
                    {fileAnalysis?.dependencies?.imports?.length > 0 && (
                      <li>
                        <span className="font-medium">Imports: </span>
                        {fileAnalysis.dependencies.imports.join(", ")}
                      </li>
                    )}
                    
                    {fileAnalysis?.dependencies?.referencedFiles?.length > 0 && (
                      <li>
                        <span className="font-medium">Referenced Files: </span>
                        <ul className="pl-5 space-y-1">
                          {fileAnalysis.dependencies.referencedFiles.map((ref, index) => (
                            <li key={index} className="text-[#4CAF50]">
                              {ref}
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                    
                    {fileAnalysis?.dependencies?.externalDependencies?.length > 0 && (
                      <li>
                        <span className="font-medium">External Dependencies: </span>
                        {fileAnalysis.dependencies.externalDependencies.join(", ")}
                      </li>
                    )}
                  </ul>
                </div>
                
                {fileAnalysis?.keyFunctionality?.length > 0 && (
                  <div>
                    <p className="font-medium text-[#EAEAEA] mb-1">Key Functionality:</p>
                    <ul className="list-disc pl-5 text-[#EAEAEA]">
                      {fileAnalysis.keyFunctionality.map((func, index) => (
                        <li key={index}>{func}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {fileAnalysis?.technicalDetails && (
                  <div>
                    <p className="font-medium text-[#EAEAEA] mb-1">Technical Details:</p>
                    <ul className="list-disc pl-5 text-[#EAEAEA]">
                      <li><span className="font-medium">Language:</span> {fileAnalysis.technicalDetails.language || 'Not specified'}</li>
                      <li><span className="font-medium">Framework:</span> {fileAnalysis.technicalDetails.framework || 'None'}</li>
                      <li><span className="font-medium">Type:</span> {fileAnalysis.technicalDetails.type || 'Not specified'}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-[#3A3D56]">
          No files have been analyzed yet. Upload some files to begin.
        </div>
      )}
    </div>
  )
}
