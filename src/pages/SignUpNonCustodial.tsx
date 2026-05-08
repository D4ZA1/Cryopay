import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { register } from '@/lib/api';

const GreenCryoPayLogo = () => (
  <div className="text-2xl font-bold tracking-tighter">
    Green<span className="text-green-600">Cryo</span>Pay
  </div>
);

const SignUpNonCustodial = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!email.trim()) { setError('Email is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setIsLoading(true);
    setError(null);

    try {
      const response = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        password,
      });

      if (response.ok && response.data?.token) {
        setSuccess(true);
        login(response.data.token, {
          id: response.data.user.id,
          firstName: response.data.user.first_name || firstName.trim(),
          lastName: response.data.user.last_name || lastName.trim(),
          email: response.data.user.email,
        });
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        setError(response.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 font-sans">
      <header className="w-full max-w-md mx-auto py-6 flex-shrink-0">
        <div className="flex justify-center"><GreenCryoPayLogo /></div>
        <div className="mt-4">
          <p className="text-sm text-slate-500 font-medium mb-1 text-center">Create your account</p>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-green-600 h-1.5 rounded-full transition-all" style={{ width: success ? '100%' : '50%' }} />
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Create Account</h1>
            <p className="text-slate-500 mt-2">
              Your Ethereum wallet is created automatically — no browser extension needed.
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-slate-800">Account created!</p>
              <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="Satoshi"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Nakamoto"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="satoshi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={handleRegister}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating account & wallet...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignUpNonCustodial;
