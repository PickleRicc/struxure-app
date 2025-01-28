import { supabase } from '../../../utils/supabase'
import { NextResponse } from 'next/server'
import { deleteFromBlob } from '../../../utils/azure'

export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Delete project files from Azure Blob Storage
    await deleteFromBlob(projectId)

    // Delete project (this will cascade delete files in Supabase)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
