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

  const handleAnalysisComplete = (analysisData) => {
    if (analysisData) {
      setAnalysis(analysisData);
      setAnalysisLoading(false);
      setActiveTab('text');
    }
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
    <div className="min-h-screen bg-black">
      <nav className="bg-[#1A1B26] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => router.push('/homepage')}
                className="text-[#EAEAEA] hover:text-[#4CAF50] transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Home</span>
              </button>
              <span className="text-[#3A3D56]">|</span>
              <span className="text-[#EAEAEA] font-medium">
                {project?.title || 'Project Details'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Project Header */}
          <div className="bg-[#1A1B26] shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-[#EAEAEA] mb-2">
              {project.title || 'Untitled Project'}
            </h1>
            <p className="text-sm text-[#3A3D56]">
              Project ID: {project.id}
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-[#1A1B26] shadow rounded-lg overflow-hidden">
            <div className="border-b border-[#3A3D56]">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`${
                    activeTab === 'upload'
                      ? 'border-[#4CAF50] text-[#4CAF50]'
                      : 'border-transparent text-[#3A3D56] hover:text-[#EAEAEA] hover:border-[#3A3D56]'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Upload Files
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`${
                    activeTab === 'text'
                      ? 'border-[#4CAF50] text-[#4CAF50]'
                      : 'border-transparent text-[#3A3D56] hover:text-[#EAEAEA] hover:border-[#3A3D56]'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Text Map
                </button>
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`${
                    activeTab === 'visual'
                      ? 'border-[#4CAF50] text-[#4CAF50]'
                      : 'border-transparent text-[#3A3D56] hover:text-[#EAEAEA] hover:border-[#3A3D56]'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Visual Map
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-[#1A1B26] border border-[#3A3D56] rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-[#4CAF50]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#EAEAEA]">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-[#EAEAEA]">
                        <p>{error}</p>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={handleRetry}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-[#EAEAEA] bg-[#3A3D56] hover:bg-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50]"
                        >
                          Retry Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {analysisStatus && (
                <div className="mb-8 text-center">
                  <div className="inline-flex flex-col items-center">
                    {/* Loading spinner */}
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-[#3A3D56] rounded-full animate-pulse"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-[#4CAF50] rounded-full animate-spin" style={{ borderTopColor: 'transparent', animationDuration: '1.5s' }}></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    {/* Status text with typing animation */}
                    <div className="space-y-2">
                      <div className="text-lg font-medium text-[#4CAF50] animate-pulse">
                        {analysisStatus}
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'upload' && (
                <div>
                  <h2 className="text-xl font-semibold text-[#EAEAEA] mb-4">
                    Upload Files
                  </h2>
                  <div className="bg-[#1A1B26]/50 border border-[#3A3D56] rounded-lg p-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-[#4CAF50] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[#EAEAEA]/90">
                        <span className="font-medium">Important:</span> Please upload all your files in a single operation. Files are linked to the project during the initial upload, and subsequent uploads may not be properly associated with this project.
                      </p>
                    </div>
                  </div>
                  <FolderUpload 
                    projectId={projectId} 
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                </div>
              )}

              {activeTab === 'text' && (
                <div>
                  <h2 className="text-xl font-semibold text-[#EAEAEA] mb-4">
                    Text Map
                  </h2>
                  {analysisLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-4">
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#3A3D56]/30 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#4CAF50] rounded-full animate-spin" style={{ borderTopColor: 'transparent', animationDuration: '1s' }}></div>
                        </div>
                        <div className="text-lg text-[#EAEAEA] mb-2">Processing Files</div>
                        <div className="text-sm text-[#3A3D56]">This may take a few moments...</div>
                      </div>
                    </div>
                  ) : analysis ? (
                    <TextMap analysis={analysis} />
                  ) : (
                    <div className="text-center py-12 text-[#3A3D56]">
                      No analysis available. Upload files to generate a map.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'visual' && (
                <div>
                  <h2 className="text-xl font-semibold text-[#EAEAEA] mb-4">
                    Visual Map
                  </h2>
                  {analysisLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-4">
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#3A3D56]/30 rounded-full"></div>
                          <div className="absolute top-0 left-0 w-full h-full border-4 border-[#4CAF50] rounded-full animate-spin" style={{ borderTopColor: 'transparent', animationDuration: '1s' }}></div>
                        </div>
                        <div className="text-lg text-[#EAEAEA] mb-2">Processing Files</div>
                        <div className="text-sm text-[#3A3D56]">This may take a few moments...</div>
                      </div>
                    </div>
                  ) : analysis ? (
                    <FileTreeMap analysis={analysis} />
                  ) : (
                    <div className="text-center py-12 text-[#3A3D56]">
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
