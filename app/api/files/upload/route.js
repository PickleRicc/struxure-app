import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';
import { uploadToBlob } from '../../../utils/azure';
import { shouldExcludeFile } from '../../../utils/fileFilters';

export async function POST(request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const projectId = formData.get('projectId');
    const files = formData.getAll('files');

    if (!projectId || !files.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Skip files that should be excluded
      if (shouldExcludeFile(file.name)) {
        continue;
      }

      try {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Azure Blob Storage
        const azureBlobUrl = await uploadToBlob(
          projectId,
          file.name,
          buffer,
          file.type || 'application/octet-stream'
        );

        // Store metadata in Supabase
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            project_id: projectId,
            filename: file.name,
            azure_blob_url: azureBlobUrl
          })
          .select()
          .single();

        if (fileError) throw fileError;
        uploadedFiles.push(fileData);

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
