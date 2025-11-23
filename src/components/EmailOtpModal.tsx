import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface EmailOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  // called when a session is detected after user clicks the magic link / enters code
  onVerified?: () => void;
}

const RESEND_COOLDOWN = 30; // seconds

const EmailOtpModal = ({ isOpen, onClose, userEmail, onVerified }: EmailOtpModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const sendMagicLink = async () => {
    setError('');
    setIsLoading(true);
    try {
      console.log('[EmailOtpModal] sending magic link / OTP to', userEmail);
  const redirectTo = `${window.location.origin}/`;
  const { error } = await supabase.auth.signInWithOtp({ email: userEmail, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
      setLastSentAt(Date.now());
      setSecondsLeft(RESEND_COOLDOWN);
    } catch (err: any) {
      console.error('[EmailOtpModal] send error', err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for session: if user clicked the magic link, supabase will have a session
  const checkSession = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const session = (data as any)?.session;
      if (session) {
        // Avoid multiple invocations if polling races
        if (doneRef.current) return;
        doneRef.current = true;
        console.log('[EmailOtpModal] session detected via polling');
        // stop polling immediately
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        if (onVerified) onVerified();
        onClose();
      }
    } catch (err) {
      console.error('[EmailOtpModal] session check error', err);
    }
  };

  useEffect(() => {
    let intervalId: number | undefined;
    let pollId: number | undefined;
    if (isOpen) {
      // start countdown if we just opened and have lastSentAt
      if (lastSentAt) {
        const elapsed = Math.floor((Date.now() - lastSentAt) / 1000);
        setSecondsLeft(Math.max(0, RESEND_COOLDOWN - elapsed));
      }
  // start session polling every 3s
  pollId = window.setInterval(() => checkSession(), 3000);
  pollRef.current = pollId;
      // start countdown interval
      intervalId = window.setInterval(() => {
        setSecondsLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (pollId) window.clearInterval(pollId);
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      doneRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lastSentAt]);

  const handleIClicked = async () => {
    setIsLoading(true);
    setError('');
    try {
      await checkSession();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    await sendMagicLink();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>
            We've sent a sign-in link to <strong>{userEmail}</strong>. Open it to complete sign-in, or click the button below once you've clicked it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-full space-y-2">
            <p className="text-sm text-slate-600 text-center">Check your inbox for an email from Supabase. If you don't see it, check your spam folder.</p>
            {lastSentAt && <p className="text-xs text-slate-400 text-center">Last sent: {new Date(lastSentAt).toLocaleTimeString()}</p>}
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>

          <div className="w-full grid grid-cols-2 gap-2">
            <Button onClick={handleIClicked} className="col-span-2" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} I clicked the link / I received the code
            </Button>
            <Button variant="ghost" onClick={handleResend} disabled={secondsLeft > 0}>
              {secondsLeft > 0 ? `Resend (${secondsLeft}s)` : 'Resend email'}
            </Button>
            <Button variant="outline" onClick={() => { onClose(); }}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailOtpModal;