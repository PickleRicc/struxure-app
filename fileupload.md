import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';

export default function FileUpload({ projectId, onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const { user } = useAuth();

  const handleUpload = async (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setStatus('Uploading files...');

    try {
      const formData = new FormData();
      formData.append('projectId', projectId.toString());
      
      Array.from(files).forEach((file) => {
        formData.append('file', file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStatus('Processing files...');
      let processedCount = 0;
      
      for (const file of data.files) {
        if (/\.(rpm|exe|dll|bin|zip|tar|gz|rar|7z|iso)$/i.test(file.filename)) {
          continue;
        }

        try {
          setStatus(`Generating embeddings for ${file.filename}...`);
          const embedRes = await fetch('/api/embeddings/generate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileId: file.id })
          });

          if (embedRes.ok) {
            processedCount++;
            setStatus(`Processed ${processedCount} files...`);
          }
        } catch (embedError) {
          console.error('Error processing:', file.filename, embedError);
        }
      }
      
      setStatus('Complete!');
      if (onUploadComplete) {
        onUploadComplete(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-4 text-sm text-gray-400">
        Select a folder or multiple files to upload
      </div>
      
      <label className="block">
        <span className="sr-only">Choose files</span>
        <input
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-500 file:text-white
            hover:file:bg-blue-600
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>
      
      {status && (
        <div className="mt-2 text-sm text-blue-500">
          {status}
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}