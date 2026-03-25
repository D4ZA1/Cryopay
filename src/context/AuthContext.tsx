import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
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
        console.log('[AuthContext] initializing session from localStorage');
        // Check for token in localStorage (set by Worker API login)
        const storedToken = localStorage.getItem('cryopay_token');
        if (storedToken && mounted) {
          setToken(storedToken);
          // Fetch user profile using the token
          const response = await apiFetch('/api/profile');
          if (response.ok && response.data?.profile) {
            const profile = response.data.profile;
            setUser({
              id: profile.id,
              firstName: profile.first_name || profile.email || 'User',
              lastName: profile.last_name || undefined,
              email: profile.email || undefined,
              phone: profile.phone || null,
              user_metadata: { notifications: profile.notifications ? JSON.parse(profile.notifications) : {} },
            });
            console.log('[AuthContext] session restored from token');
          }
        }
      } catch (e) {
        console.error('[AuthContext] unexpected error while initializing session', e);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshUser = async () => {
    try {
      const response = await apiFetch('/api/profile');
      if (response.ok && response.data?.profile) {
        const profile = response.data.profile;
        setUser({
          id: profile.id,
          firstName: profile.first_name || profile.email || 'User',
          lastName: profile.last_name || undefined,
          email: profile.email || undefined,
          phone: profile.phone || null,
          user_metadata: { notifications: profile.notifications ? JSON.parse(profile.notifications) : {} },
        });
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
    // Clear local token (Worker doesn't need to do anything for logout)
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

