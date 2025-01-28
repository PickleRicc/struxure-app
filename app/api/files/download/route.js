import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';
import { downloadFromBlob } from '../../../utils/azure';

export async function POST(request) {
  try {
    console.log('Starting file download process...');
    
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

    // Get project ID from request body
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log(`Fetching files for project: ${projectId}`);
    
    // Get all files for this project from Supabase
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (filesError) {
      console.error('Error fetching files from Supabase:', filesError);
      return NextResponse.json({ error: filesError.message }, { status: 500 });
    }

    console.log(`Found ${files.length} files to download`);

    // Download each file
    const downloadedFiles = [];
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.filename}`);
        console.log(`Downloading from URL: ${file.azure_blob_url}`);
        
        const buffer = await downloadFromBlob(file.azure_blob_url);
        const content = buffer.toString('utf-8');
        
        console.log(`Successfully downloaded ${file.filename}. Content length: ${content.length} characters`);
        
        downloadedFiles.push({
          id: file.id,
          filename: file.filename,
          content
        });
      } catch (error) {
        console.error(`Error downloading file ${file.filename}:`, error);
        // Continue with other files even if one fails
      }
    }

    console.log(`Successfully downloaded ${downloadedFiles.length} out of ${files.length} files`);

    return NextResponse.json({ 
      success: true, 
      files: downloadedFiles 
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
