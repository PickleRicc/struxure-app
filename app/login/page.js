'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Login from '../components/Login';
import { getCurrentUser } from '../utils/supabase';

export default function LoginPage() {
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
    <div>
      <Login />
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
