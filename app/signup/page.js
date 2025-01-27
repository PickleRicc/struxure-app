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
    <div>
      <SignUp />
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
