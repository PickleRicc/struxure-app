import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';
import { parseFileContent } from '../../../utils/textParser';

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

    // Get files from request body
    const { files } = await request.json();
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 });
    }

    console.log(`\n====== Starting to parse ${files.length} files ======\n`);
    
    // Parse each file
    const parsedFiles = files.map(file => {
      console.log(`\nProcessing: ${file.filename}`);
      const parseResult = parseFileContent(file.filename, file.content);
      
      if (parseResult.success) {
        console.log('Parse successful!');
        if (parseResult.stats) {
          console.log(`Statistics:
- Lines of code: ${parseResult.stats.lines}
- Characters: ${parseResult.stats.characters}
- File type: ${parseResult.type}`);
        }
      } else {
        console.log(`Parse failed: ${parseResult.error}`);
      }
      
      return {
        id: file.id,
        filename: file.filename,
        ...parseResult
      };
    });

    // Filter successful parses
    const successfulParses = parsedFiles.filter(file => file.success);
    
    // Log summary
    console.log('\n====== Parsing Summary ======');
    console.log(`Total files processed: ${files.length}`);
    console.log(`Successfully parsed: ${successfulParses.length}`);
    console.log(`Failed to parse: ${files.length - successfulParses.length}`);
    
    // Calculate total lines of code
    const totalLines = successfulParses.reduce((sum, file) => sum + (file.stats?.lines || 0), 0);
    console.log(`Total lines of code: ${totalLines}`);
    
    // Group by file type
    const fileTypes = successfulParses.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {});
    console.log('\nFile types processed:', fileTypes);

    return NextResponse.json({ 
      success: true,
      totalFiles: files.length,
      successfulParses: successfulParses.length,
      totalLines,
      fileTypes,
      files: parsedFiles
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
