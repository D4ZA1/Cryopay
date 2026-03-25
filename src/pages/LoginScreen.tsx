import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Wallet, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

const CryoPayLogo = () => ( <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div> );

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('[LoginScreen] signing in with Worker API');
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        console.error('[LoginScreen] login error', response.error);
        throw new Error(response.error || 'Login failed');
      }
      
      console.log('[LoginScreen] login success', response.data);
      const { token, user } = response.data;
      
      if (!token || !user) {
        setError('Invalid response from server');
        return;
      }

      // Complete login with token and user data
      login(token, { 
        id: user.id, 
        firstName: user.first_name || user.email,
        lastName: user.last_name,
        email: user.email,
      });
      navigate('/dashboard');

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
    </>
  );
};

export default LoginScreen;