'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '../utils/supabase';
import Link from 'next/link';
import CreateProject from '../components/CreateProject';
import ProjectList from '../components/ProjectList';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function checkUser() {
      const { user: currentUser } = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    }
    checkUser();
  }, [router]);

  const handleProjectCreated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="bg-gradient-to-r from-[#1A1B26] to-[#1E1E2E] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2 transition-transform duration-300 hover:scale-105">
              <svg className="w-8 h-8 text-[#4CAF50] transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-2xl font-bold text-[#EAEAEA] transition-colors duration-300">Struxure</span>
            </div>
            <div className="flex items-center">
              {user && (
                <div className="flex items-center">
                  <span className="text-[#EAEAEA] mr-4">{user.email}</span>
                  <div className="w-px h-6 bg-[#3A3D56] mx-4"></div>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-4 py-2 border border-[#3A3D56] text-sm font-medium rounded-md text-[#EAEAEA] bg-[#1E1E2E] hover:bg-[#4CAF50] hover:border-[#4CAF50] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50]"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!loading && user && (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="bg-gradient-to-b from-[#1A1B26] to-[#1E1E2E] shadow-lg rounded-lg p-8 text-center transform transition-all duration-300 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzNBM0Q1NiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-10"></div>
              <div className="relative">
                <h1 className="text-3xl font-bold text-[#EAEAEA] mb-3">Welcome to Struxure!</h1>
                <p className="text-xl text-[#4CAF50] mb-8">The Ultimate File Mapping Experience.</p>
                <div className="flex items-center justify-center space-x-6 text-[#EAEAEA]/80">
                  <div className="group flex flex-col items-center transition-transform duration-200 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-[#1E1E2E] border-2 border-[#3A3D56] group-hover:border-[#4CAF50] transition-colors duration-200">
                      <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-[#4CAF50] font-medium mb-1">Step 1</span>
                    <span className="text-sm">Create a New Project</span>
                  </div>
                  <div className="flex-shrink-0 text-[#3A3D56] transition-transform duration-200 group-hover:translate-x-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="group flex flex-col items-center transition-transform duration-200 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-[#1E1E2E] border-2 border-[#3A3D56] group-hover:border-[#4CAF50] transition-colors duration-200">
                      <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-[#4CAF50] font-medium mb-1">Step 2</span>
                    <span className="text-sm">Upload Folder</span>
                  </div>
                  <div className="flex-shrink-0 text-[#3A3D56] transition-transform duration-200 group-hover:translate-x-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="group flex flex-col items-center transition-transform duration-200 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-[#1E1E2E] border-2 border-[#3A3D56] group-hover:border-[#4CAF50] transition-colors duration-200">
                      <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <span className="text-[#4CAF50] font-medium mb-1">Step 3</span>
                    <span className="text-sm">Build Map</span>
                  </div>
                  <div className="flex-shrink-0 text-[#3A3D56] transition-transform duration-200 group-hover:translate-x-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="group flex flex-col items-center transition-transform duration-200 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-[#1E1E2E] border-2 border-[#3A3D56] group-hover:border-[#4CAF50] transition-colors duration-200">
                      <svg className="w-6 h-6 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[#4CAF50] font-medium mb-1">Step 4</span>
                    <span className="text-sm">Done!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-b from-[#1A1B26] to-[#1E1E2E] shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzNBM0Q1NiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-10"></div>
              <div className="relative">
                <h2 className="text-lg font-medium text-[#EAEAEA] mb-4">Create New Project</h2>
                <CreateProject onProjectCreated={handleProjectCreated} />
              </div>
            </div>
            
            <div className="bg-gradient-to-b from-[#1A1B26] to-[#1E1E2E] shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzNBM0Q1NiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-10"></div>
              <div className="relative">
                <h2 className="text-lg font-medium text-[#EAEAEA] mb-4">Your Projects</h2>
                <ProjectList key={refreshKey} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
