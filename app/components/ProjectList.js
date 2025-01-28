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
    return <div className="text-center">Loading projects...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>
  }

  if (projects.length === 0) {
    return <div className="text-center text-gray-500">No projects found</div>
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
        >
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {project.title || 'Untitled Project'}
            </h3>
            <p className="text-sm text-gray-500">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewProject(project.id)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Project
            </button>
            <button
              onClick={() => handleDeleteProject(project.id)}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
