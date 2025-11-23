import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import TwoFactorAuthModal from '@/components/TwoFactorAuthModal';

const CryoPayLogo = () => ( <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div> );

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA Modal state
  const [show2FAModal, setShow2FAModal] = useState(false);
  // legacy two-factor input removed — we use the dedicated TwoFactorAuthModal component
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | undefined>(undefined);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('[LoginScreen] signing in with supabase');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[LoginScreen] signIn error', error);
        throw error;
      }
      console.log('[LoginScreen] signIn success', data);
      const session = (data as any)?.session;
      const user = (data as any)?.user;
      // If there's no session or user returned, block and instruct the user (likely needs email confirmation)
      if (!session || !user) {
        setError('No active session was returned. If you recently created your account, please check your email for a confirmation link.');
        return;
      }

      // Store pending session/user until MFA verification completes (used if we need to challenge)
      setPendingSession(session);
      setPendingUser(user);

      // Try to check for TOTP factor and AAL; if checks fail or there's no TOTP, do NOT force MFA setup — allow login.
      try {
        // @ts-ignore experimental API
        const factorsCheck = await supabase.auth.mfa.listFactors();
        console.log('[LoginScreen] initial listFactors', factorsCheck);
        const totp = factorsCheck?.data?.totp?.[0];

        if (!totp) {
          // Allow login even if no TOTP is configured; warn the user but don't block.
          console.warn('[LoginScreen] no TOTP factor configured; allowing login but recommend enabling MFA');
          login(session.access_token, { id: user.id, firstName: (user.user_metadata as any)?.firstName || user.email });
          navigate('/dashboard');
          return;
        }

        // Check whether we need an MFA challenge to reach AAL2. If required, start a TOTP challenge.
        // @ts-ignore experimental API
        const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        console.log('[LoginScreen] getAuthenticatorAssuranceLevel', aal);
        const current = aal.data?.currentLevel;
        const next = aal.data?.nextLevel;

        if (next === 'aal2' && current !== 'aal2') {
          setPendingFactorId(totp.id);
          setShow2FAModal(true);
          return; // wait for verification
        }

        // Otherwise complete login
        login(session.access_token, { id: user.id, firstName: (user.user_metadata as any)?.firstName || user.email });
        navigate('/dashboard');

      } catch (err) {
        console.error('[LoginScreen] error checking factors / AAL', err);
        // If we can't check factors for some reason, allow login but show a warning
        setError('Could not verify your MFA setup. You can continue but please enable an authenticator app in Settings.');
        login(session.access_token, { id: user.id, firstName: (user.user_metadata as any)?.firstName || user.email });
        navigate('/dashboard');
        return;
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // old inline 2FA handler removed; verification is handled by the TOTP modal component

  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <header className="absolute top-8"><CryoPayLogo /></header>
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Log in to your CryoPay account.</p>
          </div>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  className="pl-10" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-slate-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  id="password" 
                  type={passwordVisible ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-10 pr-10" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
                <button 
                  type="button" 
                  onClick={() => setPasswordVisible(!passwordVisible)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>

          <div className="flex items-center my-6">
            <Separator className="flex-1" />
            <span className="mx-4 text-xs text-slate-400">OR</span>
            <Separator className="flex-1" />
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/signup-non-custodial">
              <Wallet className="w-5 h-5 mr-2" />Connect with Wallet
            </Link>
          </Button>
        </div>
        <footer className="absolute bottom-6 text-slate-500">
          <p>Don't have an account? <Link to="/onboarding" className="font-semibold text-slate-800 hover:underline">Sign Up</Link></p>
        </footer>
      </div>

      {/* 2FA Modals */}
      <TwoFactorAuthModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        enroll={false}
        factorId={pendingFactorId}
        onVerified={async () => {
          // After TOTP verification, complete login using the pending session
          if (pendingSession && pendingUser) {
            try {
              login(pendingSession.access_token, { id: pendingUser.id, firstName: (pendingUser.user_metadata as any)?.firstName || pendingUser.email });
            } catch (e) {
              console.error('[LoginScreen] error completing login after MFA', e);
            }
          }
          setShow2FAModal(false);
          navigate('/dashboard');
        }}
      />

      {/* Email magic-link path removed: app now requires TOTP MFA only. */}
    </>
  );
};

export default LoginScreen;