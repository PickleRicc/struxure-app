'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../utils/supabase'
import FolderUpload from '../../components/FolderUpload'

export default function ProjectPage() {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) {
        router.push('/homepage')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error || !data) {
        router.push('/homepage')
        return
      }

      setProject(data)
      setLoading(false)
    }

    fetchProject()
  }, [projectId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading project...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Project Header */}
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {project.title || 'Untitled Project'}
            </h1>
            <p className="text-sm text-gray-500">
              Project ID: {project.id}
            </p>
          </div>

          {/* Folder Upload Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Files
            </h2>
            <FolderUpload projectId={projectId} />
          </div>
        </div>
      </div>
    </div>
  )
}
