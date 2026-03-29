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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border-white/[0.06] shadow-2xl">
        <h1 className="text-2xl font-bold text-white">Secure your account</h1>
        <p className="text-sm text-slate-400 mt-2">Your account currently has no multi-factor authentication configured. Please enable at least one method to continue.</p>
        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 border-white/[0.06] rounded-xl">
            <h3 className="font-semibold text-white">Authenticator App (TOTP)</h3>
            <p className="text-sm text-slate-400 mt-2">Use an authenticator app (Google Authenticator, Authy, etc.) to generate 6-digit codes.</p>
            <Button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleOpenEnroll}>Enable Authenticator App</Button>
          </div>

          {/* Email/magic-link option removed per TOTP-only policy */}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => navigate(-1)} variant="ghost" className="bg-white/[0.06] border-white/[0.06] text-white hover:bg-white/[0.1]">Back</Button>
          <Button onClick={() => navigate('/dashboard')} disabled={!mfaEnabled} className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">Finish</Button>
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
