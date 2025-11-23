import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const [checkingMfa, setCheckingMfa] = useState(true);
  const [mfaConfigured, setMfaConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) {
        setCheckingMfa(false);
        setMfaConfigured(null);
        return;
      }
      try {
        // @ts-ignore experimental API
        const res = await supabase.auth.mfa.listFactors();
  const totpLen = res?.data && res.data.totp ? (Array.isArray(res.data.totp) ? res.data.totp.length : 0) : 0;
  if (mounted) setMfaConfigured(totpLen > 0);
      } catch (err) {
        // If MFA APIs are not available or check fails, fail-open (allow access) but log warning
        console.warn('[ProtectedRoute] could not verify MFA factors, allowing access', err);
        if (mounted) setMfaConfigured(true);
      } finally {
        if (mounted) setCheckingMfa(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (isLoading || checkingMfa) {
    return <div>Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  // If MFA is not configured, redirect to the forced setup page
  if (mfaConfigured === false) {
    return <Navigate to="/mfa-setup" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
