'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, getCurrentUser } from './supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current user on mount
    const checkUser = async () => {
      try {
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser || null);
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Subscribe to auth changes
    const { data: authListener } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user || null);
    });

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
