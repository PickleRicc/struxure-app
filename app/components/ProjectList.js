'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../utils/supabase'

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  const fetchProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/projects/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch projects')
      }

      const { projects } = await response.json()
      setProjects(projects)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleViewProject = (projectId) => {
    router.push(`/project/${projectId}`)
  }

  const handleDeleteProject = async (projectId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/projects/delete?id=${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete project')
      }

      // Remove project from local state
      setProjects(projects.filter(p => p.id !== projectId))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return <div className="text-center text-[#EAEAEA]">Loading projects...</div>
  }

  if (error) {
    return <div className="text-[#4CAF50] text-center">{error}</div>
  }

  if (projects.length === 0) {
    return <div className="text-center text-[#EAEAEA]">No projects found</div>
  }

  return (
    <div className="space-y-6 bg-[#1A1B26] p-6 rounded-lg">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center justify-between p-6 bg-gradient-to-r from-[#1E1E2E] to-[#1E1E2E]/95 rounded-lg shadow-sm border border-[#3A3D56]/20 hover:border-[#3A3D56]/40 transition-all duration-200"
        >
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#EAEAEA]">
              {project.title || 'Untitled Project'}
            </h3>
            <p className="text-sm text-[#3A3D56]/80">
              Created: {new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleViewProject(project.id)}
              className="px-3 py-1.5 bg-[#3A3D56]/80 text-[#EAEAEA] text-sm font-medium rounded-md hover:bg-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50] transition-colors duration-200"
            >
              View Project
            </button>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="px-3 py-1.5 border border-[#3A3D56]/50 text-[#EAEAEA] text-sm font-medium rounded-md hover:bg-[#3A3D56]/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3A3D56] transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
