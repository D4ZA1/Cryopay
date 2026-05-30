import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { getErrorMessage } from '@/lib/utils';

const CryoPayLogo = () => (
  <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div>
);

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => ( <div className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-slate-500'}`}>{met ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}{text}</div> );

const SignUpCustodial = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // keep token to pass to next step if available (not stored client-side here)

  const passwordReqs = { length: password.length >= 8, uppercase: /[A-Z]/.test(password), number: /[0-9]/.test(password), special: /[^A-Za-z0-9]/.test(password) };
  const allPasswordReqsMet = Object.values(passwordReqs).every(Boolean);
  const passwordsMatch = password && password === confirmPassword;
  const isFormValid = firstName && lastName && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && allPasswordReqsMet && passwordsMatch && agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      console.log("Form is invalid, submission blocked.");
      return;
    }
    setIsLoading(true);
    setError('');
    console.log("Submitting form with data:", { firstName, lastName, email });

    try {
      console.log('[SignUpCustodial] calling Worker API /api/auth/register');
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      });
      
       if (!response.ok) {
         console.error('[SignUpCustodial] register error', response.error);
         throw new Error(getErrorMessage(response.error || 'Registration failed'));
       }
      
      console.log('[SignUpCustodial] register success', response.data);
      const { token, user } = response.data;
      
      // Worker API handles profile and wallet creation automatically
      // Navigate to secure-wallet with the user info
      navigate('/secure-wallet', { state: { walletAddress: null, privateKey: null, email, firstName, lastName, initialToken: token } });

     } catch (err: any) {
       console.error("Signup fetch error:", err);
       setError(getErrorMessage(err));
     } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 font-sans">
      <header className="w-full max-w-md mx-auto py-6 flex-shrink-0">
        <div className="flex justify-center"><CryoPayLogo /></div>
        <div className="mt-4">
          <p className="text-sm text-slate-500 font-medium mb-1 text-center">Step 2 of 3</p>
          <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '66%' }}></div></div>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Create your Simple Account</h1>
            <p className="text-slate-500 mt-2">Fast, secure, and ready in seconds.</p>
          </div>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" placeholder="Jane" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="email">Email Address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input id="password" type={passwordVisible ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2"><PasswordRequirement met={passwordReqs.length} text="8+ characters" /><PasswordRequirement met={passwordReqs.uppercase} text="1 uppercase letter" /><PasswordRequirement met={passwordReqs.number} text="1 number" /><PasswordRequirement met={passwordReqs.special} text="1 special character" /></div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Confirm Password</Label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input id="confirm-password" type="password" placeholder="••••••••" className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>{password && confirmPassword && (passwordsMatch ? <p className="text-xs text-green-600 flex items-center mt-1"><CheckCircle2 className="h-3 w-3 mr-1" /> Passwords match</p> : <p className="text-xs text-red-600 flex items-center mt-1"><XCircle className="h-3 w-3 mr-1" /> Passwords do not match</p>)}</div>
            <div className="flex items-center space-x-2 pt-2"><Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))} /><Label htmlFor="terms" className="text-sm text-slate-600">I agree to the <a href="#" className="underline hover:text-slate-900">Terms of Service</a></Label></div>
            <Button type="submit" disabled={!isFormValid || isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </div>
      </main>
      {/* MFA enrollment is initiated from the SecureWallet screen when the user clicks "Authenticator App (Recommended)" */}
      <footer className="w-full text-center py-4 flex-shrink-0">
        <p className="text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-slate-800 hover:underline">Log In</Link></p>
      </footer>
    </div>
  );
};

export default SignUpCustodial;

