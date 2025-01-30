'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, createProfile, signIn } from '../utils/supabase';
import Link from 'next/link';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Sign up the user
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password
      );
      if (signUpError) throw signUpError;

      // 2. Create their profile
      const { error: profileError } = await createProfile({
        email: formData.email,
        full_name: formData.fullName,
      });
      if (profileError) throw profileError;

      // 3. Sign them in automatically
      const { error: signInError } = await signIn(
        formData.email,
        formData.password
      );
      if (signInError) throw signInError;

      // 4. Redirect to homepage
      router.push('/homepage');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] bg-gradient-to-br from-[#121212] to-[#1A1B26]">
      <div className="w-full max-w-lg text-center mb-8">
        <h1 className="text-4xl font-bold text-[#EAEAEA] mb-2">Struxure</h1>
        <p className="text-[#4CAF50] text-lg">The AI Filemapping Web App</p>
      </div>
      <div className="max-w-md w-full space-y-8 p-10 bg-gradient-to-b from-[#1E1E2E] to-[#1A1B26] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] transform transition-all duration-300 hover:shadow-[0_0_50px_rgba(76,175,80,0.1)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzNBM0Q1NiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-5"></div>
        <div className="relative">
          <div className="flex justify-center mb-6">
            <svg className="w-12 h-12 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-[#EAEAEA] mb-8">
            Create your account
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[#1E1E2E]/50 border border-[#3A3D56] animate-fadeIn">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-[#4CAF50]">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-5">
            <div className="group">
              <label htmlFor="fullName" className="block text-sm font-medium text-[#EAEAEA] mb-2 transition-colors group-hover:text-[#4CAF50]">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3A3D56] group-hover:text-[#4CAF50] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="appearance-none rounded-lg block w-full pl-10 pr-3 py-2.5 border border-[#3A3D56] placeholder-[#3A3D56] text-[#EAEAEA] bg-[#1E1E2E]/50 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-200 hover:border-[#4CAF50]/50 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-[#EAEAEA] mb-2 transition-colors group-hover:text-[#4CAF50]">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3A3D56] group-hover:text-[#4CAF50] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-lg block w-full pl-10 pr-3 py-2.5 border border-[#3A3D56] placeholder-[#3A3D56] text-[#EAEAEA] bg-[#1E1E2E]/50 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-200 hover:border-[#4CAF50]/50 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-[#EAEAEA] mb-2 transition-colors group-hover:text-[#4CAF50]">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#3A3D56] group-hover:text-[#4CAF50] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg block w-full pl-10 pr-3 py-2.5 border border-[#3A3D56] placeholder-[#3A3D56] text-[#EAEAEA] bg-[#1E1E2E]/50 focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition-all duration-200 hover:border-[#4CAF50]/50 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-[#EAEAEA] bg-gradient-to-r from-[#3A3D56] to-[#4CAF50]/80 hover:from-[#4CAF50] hover:to-[#4CAF50] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50] disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
