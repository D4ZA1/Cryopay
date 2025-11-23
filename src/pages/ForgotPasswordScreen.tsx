import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MailCheck } from 'lucide-react';

const CryoPayLogo = () => ( <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div> );

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEmailValid) {
      console.log(`Password reset requested for ${email}`);
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans"><header className="absolute top-8"><CryoPayLogo /></header><div className="w-full max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">{!submitted ? ( <> <div className="text-center mb-8"><h1 className="text-3xl font-bold tracking-tighter text-slate-900">Forgot Password?</h1><p className="text-slate-500 mt-2">Enter your email and we'll send you a reset link.</p></div><form onSubmit={handleSubmit} className="space-y-6"><div className="space-y-2"><Label htmlFor="email">Your Email Address</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div><Button type="submit" disabled={!isEmailValid} className="w-full">Send Reset Link</Button></form> </> ) : ( <div className="text-center"><MailCheck className="mx-auto h-16 w-16 text-green-500 mb-4" /><h1 className="text-2xl font-bold text-slate-900">Check Your Email</h1><p className="text-slate-500 mt-2">If an account with that email exists, we have sent a password reset link. Please check your inbox and spam folder.</p><Button onClick={() => navigate('/login')} className="w-full mt-8">Back to Log In</Button></div> )}</div><footer className="absolute bottom-6 text-slate-500"><p>Remember your password? <Link to="/login" className="font-semibold text-slate-800 hover:underline">Log In</Link></p></footer></div>
  );
};

export default ForgotPasswordScreen;
