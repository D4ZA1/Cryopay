import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If enrolling, the modal will call supabase.auth.mfa.enroll() and display the QR.
  enroll?: boolean;
  // If verifying an existing factor (during login), pass factorId to challenge/verify.
  factorId?: string;
  onVerified?: () => void; // callback after successful verification
}

const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({ isOpen, onClose, enroll, factorId, onVerified }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [enrolledFactorId, setEnrolledFactorId] = useState<string | null>(null);

  // Enroll flow: when modal opens in enroll mode, request enrollment info from Supabase
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isOpen || !enroll) return;
      setIsLoading(true);
      setError('');
      try {
        console.log('[TwoFactorAuthModal] enrolling TOTP factor via supabase.auth.mfa.enroll()');
        // @ts-ignore - auth.mfa is experimental but available in this SDK
        const { supabase } = await import('../supabase');
        // @ts-ignore experimental API
        const res = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'CryoPay' });
        console.log('[TwoFactorAuthModal] enroll response', res);
        if (res.error) throw res.error;
        if (mounted) {
          // res.data has id and totp payload
          const data: any = res.data;
          setEnrolledFactorId(data.id);
          // Supabase returns either an SVG string (data.totp.qr_code) or an otpauth URI (data.totp.uri)
          const rawQr = data.totp?.qr_code || data.totp?.uri || null;
          if (rawQr) {
            // If it's an SVG string (starts with <svg), convert to a data URL for <img>
            if (rawQr.trim().startsWith('<svg')) {
              const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(rawQr)}`;
              setQrCode(svgDataUrl);
            } else {
              setQrCode(rawQr);
            }
          } else {
            setQrCode(null);
          }
        }
      } catch (err: any) {
        console.error('[TwoFactorAuthModal] enroll error', err);
        setError(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, enroll]);

  const handleVerify = async () => {
    // Basic validation for 6 digits
    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // Determine factorId to verify: prefer provided factorId prop, else use enrolledFactorId
      const fid = factorId || enrolledFactorId;
      if (!fid) throw new Error('No factor id available for verification');

  console.log('[TwoFactorAuthModal] verifying factor via supabase.auth.mfa.challenge -> verify', { factorId: fid });
  const { supabase } = await import('../supabase');
  // Step 1: create a challenge
  // @ts-ignore experimental API
  const challenge = await supabase.auth.mfa.challenge({ factorId: fid });
  console.log('[TwoFactorAuthModal] challenge result', challenge);
  if (challenge.error) throw challenge.error;
  const challengeId = challenge.data?.id;
  if (!challengeId) throw new Error('Missing challenge id from MFA challenge');

  // Step 2: verify the code against the challenge
  // @ts-ignore experimental API
  const verify = await supabase.auth.mfa.verify({ factorId: fid, challengeId, code: verificationCode });
  console.log('[TwoFactorAuthModal] verify result', verify);
  if (verify.error) throw verify.error;

      // On successful verification, Supabase should establish a higher assurance session.
      if (onVerified) onVerified();
      onClose();
    } catch (err: any) {
      console.error('[TwoFactorAuthModal] verification error', err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset error when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setVerificationCode(e.target.value);
  };

  // Close handler to reset state
  const handleClose = () => {
      setVerificationCode('');
      setError('');
      setIsLoading(false);
      onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app (e.g., Google Authenticator), then enter the 6-digit code below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {qrCode ? (
            <div className="p-4 bg-white rounded-lg">
              {/* Render QR code. supabase may return either an otpauth URI or a data URL (image).
                  The qrcode renderer can throw if the input is extremely long; prefer rendering
                  a plain <img> when a data URL is returned or the payload is very large. */}
              {(() => {
                const isDataUrl = qrCode.startsWith('data:');
                const isOtpauth = qrCode.startsWith('otpauth:');
                const canRenderWithQRCode = isOtpauth || qrCode.length < 1200;
                if (isDataUrl) {
                  console.log('[TwoFactorAuthModal] enroll returned image data URL, rendering <img>');
                  return <img src={qrCode} alt="TOTP QR code" className="mx-auto" style={{ width: 192, height: 192 }} />;
                }
                if (canRenderWithQRCode) {
                  return <QRCodeSVG value={qrCode} size={192} />;
                }
                // Fallback: if it's a long URI, show as text and render QR if possible
                console.warn('[TwoFactorAuthModal] QR payload is large; showing raw URI for manual entry');
                return <div className="text-sm break-words text-center">{qrCode}</div>;
              })()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">QR code not available yet. If you've already enrolled a factor, enter the 6-digit code from your authenticator app.</p>
          )}
          <div className="w-full space-y-2">
            <Input 
              id="otp-code" // Add id for label association if needed
              placeholder="123456" 
              className="text-center text-2xl tracking-widest h-12"
              maxLength={6} // Capping input at 6 digits
              value={verificationCode}
              onChange={handleInputChange} // Use updated handler
              aria-label="Enter 6-digit code"
            />
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>
          <Button onClick={handleVerify} className="w-full" disabled={isLoading || verificationCode.length !== 6}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify & Enable
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorAuthModal;

