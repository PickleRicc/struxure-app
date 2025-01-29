'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../utils/supabase'
import FolderUpload from '../../components/FolderUpload'
import TextMap from '../../components/TextMap'
import FileTreeMap from '../../components/FileTreeMap'

export default function ProjectPage() {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upload')
  const [analysis, setAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id

  useEffect(() => {
    async function fetchProject() {
      try {
        if (!projectId) {
          router.push('/homepage')
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) throw projectError;
        if (!projectData) throw new Error('Project not found');

        setProject(projectData)

        // Fetch latest analysis
        const { data: analysisData, error: analysisError } = await supabase
          .from('project_analyses')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!analysisError && analysisData) {
          setAnalysis(analysisData.analysis_data)
          setActiveTab('text')
        }
      } catch (err) {
        console.error('Error fetching project:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId, router])

  // Subscribe to analysis updates
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel('project_analyses')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_analyses',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        setAnalysis(payload.new.analysis_data)
        setAnalysisLoading(false)
        setActiveTab('text')
        setError(null) // Clear any previous errors
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  const handleAnalysisStart = () => {
    setAnalysisLoading(true)
    setError(null)
    setAnalysisStatus('AI is reading your files...')
    setTimeout(() => {
      if (analysisLoading) { // Only update if still loading
        setAnalysisStatus('Now creating your map...')
      }
    }, 3000)
  }

  const handleAnalysisComplete = () => {
    setAnalysisStatus('Map is created!')
    setTimeout(() => setAnalysisStatus(''), 2000)
  }

  const handleRetry = async () => {
    setError(null)
    setAnalysisLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Trigger a new analysis
      const response = await fetch('/api/files/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          projectId,
          retryAnalysis: true
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analysis failed')
      }

      setAnalysisStatus('Retrying analysis...')
    } catch (err) {
      console.error('Error retrying analysis:', err)
      setError(err.message)
      setAnalysisLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading project...</div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/homepage')}
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Homepage
          </button>
        </div>
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

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`${
                    activeTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Upload Files
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`${
                    activeTab === 'text'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Text Map
                </button>
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`${
                    activeTab === 'visual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Visual Map
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={handleRetry}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Retry Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisStatus && (
                <div className="mb-4 text-center text-sm font-medium text-blue-600">
                  {analysisStatus}
                </div>
              )}
              
              {activeTab === 'upload' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Upload Files
                  </h2>
                  <FolderUpload 
                    projectId={projectId} 
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                </div>
              )}

              {activeTab === 'text' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Text Map
                  </h2>
                  {analysisLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-pulse text-gray-500">
                        Analyzing your files...
                      </div>
                    </div>
                  ) : analysis ? (
                    <TextMap analysis={analysis} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No analysis available. Upload files to generate a map.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'visual' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Visual Map
                  </h2>
                  {analysisLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-pulse text-gray-500">
                        Analyzing your files...
                      </div>
                    </div>
                  ) : analysis ? (
                    <FileTreeMap analysis={analysis} />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No analysis available. Upload files to generate a map.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
