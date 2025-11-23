import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { clearSymKey } from '../lib/symmetricSession';

// Define the shape of your user and auth context
interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  // keep raw metadata if consumers need it
  user_metadata?: Record<string, any>;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  balance: number;
  setBalance: (n: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        console.log('[AuthContext] initializing session from Supabase');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthContext] supabase.getSession error', error);
        }
        if (data?.session && mounted) {
          setToken(data.session.access_token || null);
          const supUser = data.session.user;
          setUser({
            id: supUser.id,
            firstName: (supUser.user_metadata as any)?.firstName || supUser.email || 'User',
            lastName: (supUser.user_metadata as any)?.lastName || undefined,
            email: supUser.email || undefined,
            phone: (supUser.user_metadata as any)?.phone || null,
            user_metadata: supUser.user_metadata as any,
          });
          console.log('[AuthContext] session restored', { user: supUser });
        }
      } catch (e) {
        console.error('[AuthContext] unexpected error while initializing session', e);
      } finally {
        setIsLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] auth state changed', event, session);
      if (session?.access_token) {
        setToken(session.access_token);
        const supUser = session.user;
        setUser({
          id: supUser.id,
          firstName: (supUser.user_metadata as any)?.firstName || supUser.email || 'User',
          lastName: (supUser.user_metadata as any)?.lastName || undefined,
          email: supUser.email || undefined,
          phone: (supUser.user_metadata as any)?.phone || null,
          user_metadata: supUser.user_metadata as any,
        });
      } else {
        setToken(null);
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const refreshUser = async () => {
    try {
      // Prefer the getUser API, but fall back to the session (some SDK/edge cases
      // can return null for getUser immediately after an update).
      const { data } = await supabase.auth.getUser();
      let supUser = (data as any)?.user;
      if (!supUser) {
        // Fallback: try reading from the active session
        const { data: sessionData } = await supabase.auth.getSession();
        supUser = (sessionData as any)?.session?.user || null;
      }
      if (supUser) {
        setUser({
          id: supUser.id,
          firstName: (supUser.user_metadata as any)?.firstName || supUser.email || 'User',
          lastName: (supUser.user_metadata as any)?.lastName || undefined,
          email: supUser.email || undefined,
          phone: (supUser.user_metadata as any)?.phone || null,
          user_metadata: supUser.user_metadata as any,
        });
        setToken((await supabase.auth.getSession()).data?.session?.access_token || null);
      }
    } catch (err) {
      console.warn('[AuthContext] refreshUser failed', err);
    }
  };

  const login = (newToken: string, userData: User) => {
    // Keep for compatibility with existing callers, but prefer supabase.auth for login
    console.log('[AuthContext] login called', { userData });
    localStorage.setItem('cryopay_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = async () => {
    console.log('[AuthContext] logout');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] signOut error', err);
    }
    localStorage.removeItem('cryopay_token');
    setToken(null);
    setUser(null);
    // Clear any unlocked symmetric key from memory when user logs out
    try { clearSymKey(); } catch (e) { /* ignore */ }
    navigate('/login'); // Redirect to login on logout
  };

  const value = { token, user, login, logout, isLoading, refreshUser };

  const fullValue = { ...value, balance, setBalance };
  return <AuthContext.Provider value={fullValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

