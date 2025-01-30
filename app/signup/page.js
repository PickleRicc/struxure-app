'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignUp from '../components/SignUp';
import { getCurrentUser } from '../utils/supabase';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const { user } = await getCurrentUser();
      if (user) {
        router.push('/homepage');
      }
    }
    checkUser();
  }, [router]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#121212]">
      <div className="w-full">
        <SignUp />
      </div>
      <div className="mt-6 text-center transform -translate-y-4">
        <p className="text-sm text-[#EAEAEA]">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-[#4CAF50] hover:text-[#66BB6A] transition-colors duration-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
