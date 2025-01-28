'use client'

import { useState, useRef } from 'react'
import { supabase } from '../utils/supabase'

export default function FolderUpload({ projectId }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFolderSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    setError(null)

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

      // Upload files
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
      setProgress(100)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
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
          
          <button
            onClick={handleFolderSelect}
            disabled={uploading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Select Folder'}
          </button>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Uploading... {progress}%
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
