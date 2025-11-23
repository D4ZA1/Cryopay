import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TwoFactorAuthModal from '@/components/TwoFactorAuthModal';
import { useAuth } from '@/context/AuthContext';

const ForceMFASetup: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [error, setError] = useState('');

  // No email/magic-link option: this page only offers TOTP enrollment now.

  const handleOpenEnroll = () => {
    setError('');
    setIsEnrollOpen(true);
  };

  // Email/magic-link handlers removed — TOTP only

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl border shadow-sm">
        <h1 className="text-2xl font-bold">Secure your account</h1>
        <p className="text-sm text-slate-600 mt-2">Your account currently has no multi-factor authentication configured. Please enable at least one method to continue.</p>
        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold">Authenticator App (TOTP)</h3>
            <p className="text-sm text-slate-500 mt-2">Use an authenticator app (Google Authenticator, Authy, etc.) to generate 6-digit codes.</p>
            <Button className="mt-4" onClick={handleOpenEnroll}>Enable Authenticator App</Button>
          </div>

          {/* Email/magic-link option removed per TOTP-only policy */}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => navigate(-1)} variant="ghost">Back</Button>
          <Button onClick={() => navigate('/dashboard')} disabled={!mfaEnabled}>Finish</Button>
        </div>
      </div>

      <TwoFactorAuthModal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} enroll={true} onVerified={async () => {
        setMfaEnabled(true);
        setIsEnrollOpen(false);
        try { await refreshUser(); } catch (e) { /* ignore */ }
      }} />
    </div>
  );
};

export default ForceMFASetup;
