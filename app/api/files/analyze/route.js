import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';
import { analyzeProject } from '../../../utils/fileAnalyzer';

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

    const { projectId, files, chunks } = await request.json();
    if (!projectId || !files || !chunks) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Analyze the project
    const analysis = await analyzeProject(files, chunks);

    // Store analysis in database
    const { data: savedAnalysis, error: dbError } = await supabase
      .from('project_analyses')
      .insert({
        project_id: projectId,
        user_id: user.id,
        analysis_data: analysis,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Analysis complete',
      analysis: savedAnalysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
