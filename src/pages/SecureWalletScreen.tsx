import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
// Checkbox UI removed (wallet DB persistence disabled)
import { Label } from "@/components/ui/label";
import { ShieldAlert, Copy, Eye, QrCode, MessageSquare } from 'lucide-react';
import { apiFetch, getProfile, saveWallet } from '../lib/api';
import { useEffect } from 'react';
import { generateKeyPair, exportJwk, jwkThumbprint, encryptJwkWithPassword } from '../lib/crypto';
import { getErrorMessage } from '@/lib/utils';

const CryoPayLogo = () => (
  <div className="text-2xl font-bold tracking-tighter">Cryo<span className="text-slate-500">Pay</span></div>
);

// Auth handled via Worker API

const SecureWalletScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { walletAddress, privateKey } = location.state || {};
  const incomingFirstName = (location.state as any)?.firstName;
  const incomingLastName = (location.state as any)?.lastName;
  const initialToken = (location.state as any)?.initialToken;

  // Store initialToken from signup flow into localStorage
  useEffect(() => {
    if (initialToken) {
      localStorage.setItem('cryopay_token', initialToken);
    }
  }, [initialToken]);

  const [privateKeyRevealed, setPrivateKeyRevealed] = useState(false);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [generatedPublicJwk, setGeneratedPublicJwk] = useState<JsonWebKey | null>(null);
  const [generatedPrivateJwk, setGeneratedPrivateJwk] = useState<JsonWebKey | null>(null);
  const [displayAddress, setDisplayAddress] = useState<string | null>(walletAddress || null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  // Note: MFA is optional/disabled for now per request
  const [error, setError] = useState('');

  const handleCopyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  
  const handleOpenQrModal = async () => setQrModalOpen(true);

  // Try to persist incoming profile metadata if present and if a session exists
  useEffect(() => {
    (async () => {
      if (!incomingFirstName && !incomingLastName) return;
      try {
        const token = localStorage.getItem('cryopay_token');
        if (token) {
          console.log('[SecureWallet] saving incoming profile metadata');
          const updateRes = await apiFetch('/api/profile', {
            method: 'PUT',
            body: JSON.stringify({ first_name: incomingFirstName, last_name: incomingLastName }),
          });
          if (!updateRes.ok) console.warn('[SecureWallet] updateUser metadata warning', updateRes.error);
        } else {
          console.log('[SecureWallet] no active session; metadata should already be set by signUp if supported');
        }
      } catch (e) {
        console.warn('[SecureWallet] error saving incoming metadata', e);
      }
    })();
  }, [incomingFirstName, incomingLastName]);

  // Generate a keypair on mount as part of wallet creation, or derive public from incoming private JWK
  useEffect(() => {
    (async () => {
      try {
        // If we were navigated here with a privateKey in location.state (e.g., from signup/signin), try to parse
        if (privateKey) {
          try {
            const parsed = typeof privateKey === 'string' ? JSON.parse(privateKey) : privateKey;
            // If parsed JWK contains public parameters x/y, derive the public JWK from it
            if (parsed && parsed.x && parsed.y) {
              const pub: JsonWebKey = { kty: parsed.kty, crv: parsed.crv, x: parsed.x, y: parsed.y };
              setGeneratedPrivateJwk(parsed as JsonWebKey);
              setGeneratedPublicJwk(pub);
              const tp = await jwkThumbprint(pub);
              setDisplayAddress(tp);
              // store private in memory temporarily for backup/copy
              (window as any).__cryopay_private_jwk = parsed;
              return;
            }
          } catch (e) {
            // Not JSON or can't parse — fall through to generate new keys
            console.warn('[SecureWallet] incoming privateKey not parsed as JWK, generating a new keypair', e);
          }
        }

        // Default: generate a new keypair
        const kp = await generateKeyPair();
        const priv = await exportJwk(kp.privateKey);
        const pub = await exportJwk(kp.publicKey);
        setGeneratedPrivateJwk(priv as JsonWebKey);
        setGeneratedPublicJwk(pub as JsonWebKey);
        const tp = await jwkThumbprint(pub as JsonWebKey);
        setDisplayAddress(tp);
        // store in a temporary global so other pages (like Wallet) can reuse if needed
        (window as any).__cryopay_private_jwk = priv;
      } catch (err) {
        console.error('[SecureWallet] keygen failed', err);
        setError('Failed to generate wallet keys in the browser');
      }
    })();
  }, []);

  // Server-side wallet persistence has been removed; users are expected to manage backups locally.

  const handleDownloadEncryptedBackup = async () => {
    try {
      if (!generatedPrivateJwk) return setError('No private key to download');
      if (!encryptionPassword) return setError('Enter an encryption password before downloading backup');
      const encrypted = await encryptJwkWithPassword(generatedPrivateJwk, encryptionPassword);
      const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cryopay-wallet-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // Wipe private key from memory
      delete (window as any).__cryopay_private_jwk;
      setGeneratedPrivateJwk(null);
      setPrivateKeyRevealed(false);
      setError('');
    } catch (err) {
      console.error('download backup failed', err);
      setError('Failed to generate backup');
    }
  };

  const handleWipeMemory = () => {
    delete (window as any).__cryopay_private_jwk;
    setGeneratedPrivateJwk(null);
    setPrivateKeyRevealed(false);
    setError('Private key cleared from memory');
  };

  // Email magic-link option removed; TOTP is optional. Allow finish without MFA.

  const handleFinish = async () => {
    // Validate that encryption password is provided before proceeding
    if (!encryptionPassword) {
      setError('Please enter an encryption password to secure your private key before proceeding');
      return;
    }
    
    if (!generatedPrivateJwk) {
      setError('No private key available. Please refresh the page and try again.');
      return;
    }
    
    try {
      // Get current user from profile API
      let userId: string | null = null;
      try {
        const profRes = await getProfile();
        userId = profRes.data?.profile?.id || null;
      } catch (err) {
        console.warn('getProfile failed', err);
      }

      if (generatedPublicJwk) {
        // Store thumbprint inside the public_key JSON so downstream lookups can use it
        const publicKeyWithThumb = { jwk: generatedPublicJwk, thumbprint: displayAddress };
        // Update profile with public key and encrypted private key
        let encryptedPrivateKey: string | undefined;
        if (generatedPrivateJwk && encryptionPassword) {
          try {
            const encrypted = await encryptJwkWithPassword(generatedPrivateJwk, encryptionPassword);
            encryptedPrivateKey = JSON.stringify(encrypted);
          } catch (e) {
            console.warn('encrypt private jwk for profile failed', e);
            setError('Failed to encrypt private key. Please try again.');
            return;
          }
        }
         const updErr = await apiFetch('/api/profile', {
           method: 'PUT',
           body: JSON.stringify({ 
             public_key: JSON.stringify(publicKeyWithThumb),
             encrypted_private_key: encryptedPrivateKey
           }),
         });
          console.log('[SecureWallet] profile update result:', updErr);
          if (!updErr.ok) {
            console.warn('failed to persist keys to profile', updErr.error);
            setError('Failed to save wallet to profile: ' + getErrorMessage(updErr.error));
            return;
          }
      }

      // Also save to wallet table so other users can discover public_key by email
      if (userId) {
        try {
          let encryptedPrivate: any = null;
          if (generatedPrivateJwk && encryptionPassword) {
            try {
              encryptedPrivate = await encryptJwkWithPassword(generatedPrivateJwk, encryptionPassword);
            } catch (e) {
              console.warn('encrypt private jwk failed', e);
            }
          }

          const publicKeyStr = generatedPublicJwk ? JSON.stringify({ jwk: generatedPublicJwk, thumbprint: displayAddress }) : undefined;
          const walletRes = await saveWallet(publicKeyStr || '', encryptedPrivate ? JSON.stringify(encryptedPrivate) : '', false);
          console.log('[SecureWallet] wallet save result:', walletRes);
          if (!walletRes.ok) {
            console.warn('wallet save failed', walletRes.error);
            // Note: We continue even if wallet save fails, as profile update succeeded
          }
        } catch (e) {
          console.warn('wallet save unexpected error', e);
        }
      } else if ((location.state as any)?.email) {
        // No authenticated user id available (likely email-confirm flow). Try to persist by email
        try {
          let encryptedPrivate: any = null;
          if (generatedPrivateJwk && encryptionPassword) {
            try {
              encryptedPrivate = await encryptJwkWithPassword(generatedPrivateJwk, encryptionPassword);
            } catch (e) {
              console.warn('encrypt private jwk failed', e);
            }
          }

          const publicKeyStr = generatedPublicJwk ? JSON.stringify({ jwk: generatedPublicJwk, thumbprint: displayAddress }) : undefined;
          const profileUpsertByEmail: any = { email: (location.state as any).email };
          if (generatedPublicJwk) profileUpsertByEmail.public_key = { jwk: generatedPublicJwk, thumbprint: displayAddress };
          if (encryptedPrivate) profileUpsertByEmail.encrypted_private_key = encryptedPrivate;

          const profileRes = await apiFetch('/api/profile', {
            method: 'POST',
            body: JSON.stringify(profileUpsertByEmail),
          });
          if (!profileRes.ok) console.warn('profile upsert by email failed', profileRes.error);
        } catch (e) {
          console.warn('[SecureWallet] profile upsert by email unexpected error', e);
        }
      } else {
        console.warn('[SecureWallet] no user id available and no email in state; profiles not upserted');
      }
    } catch (e) {
      console.warn('persist public key failed', e);
      setError('Failed to save wallet. Please try again.');
      return;
    }
    navigate('/dashboard');
  };


  return (
    <>
      <div className="min-h-screen bg-slate-50 flex flex-col p-4 font-sans">
        <header className="w-full max-w-lg mx-auto py-6 flex-shrink-0">
          <div className="flex justify-center"><CryoPayLogo /></div>
          <div className="mt-4">
            <p className="text-sm text-slate-500 font-medium mb-1 text-center">Step 3 of 3</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-slate-800 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tighter text-slate-900">Your New Wallet is Ready!</h1>
              <p className="text-slate-500 mt-2">Final steps: back up your credentials and secure your account.</p>
            </div>
            
            {/* Wallet Credentials */}
            <div className="space-y-2">
              <Label>Your CryoPay Public Address</Label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md">
                  <code className="truncate text-slate-700">{displayAddress || '...'}</code>
                  <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(displayAddress || '')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
            </div>
            
            <div className="p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-800 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-6 w-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold">IMPORTANT: Back Up Your Private Key</h3>
                  <p className="text-sm">We do not store this key. If you lose it, your funds are lost forever.</p>
                </div>
              </div>
              <div className="bg-white p-3 rounded-md">
                {privateKeyRevealed ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <code className="truncate text-slate-700 text-sm">{(generatedPrivateJwk ? JSON.stringify(generatedPrivateJwk) : privateKey) || '...'}</code>
                      <Button variant="ghost" size="icon" onClick={() => handleCopyToClipboard(generatedPrivateJwk ? JSON.stringify(generatedPrivateJwk) : privateKey)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Server-side wallet storage removed; user handles backups locally */}
                    <div>
                      <Label className="block text-sm font-semibold text-red-600">* Encryption password required to store the private key encrypted</Label>
                      <input 
                        type="password" 
                        value={encryptionPassword} 
                        onChange={e => setEncryptionPassword(e.target.value)} 
                        className="mt-1 block w-full rounded border px-3 py-2 border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                        placeholder="Enter a password to encrypt your private key (REQUIRED)" 
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDownloadEncryptedBackup} className="btn btn-outline">Download Encrypted Backup</button>
                      <button onClick={handleWipeMemory} className="btn btn-ghost">Clear Private Key From Memory</button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={() => setPrivateKeyRevealed(true)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Reveal Private Key
                  </Button>
                )}
              </div>
            </div>

            {/* 2FA Choices */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800">Set Up 2-Factor Authentication (Optional)</h3>
                  <p className="text-sm text-slate-500">Optional: add an authenticator for extra protection.</p>
                </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleOpenQrModal}
              >
                <QrCode className="w-5 h-5 mr-3"/> Authenticator App (Optional)
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <MessageSquare className="w-5 h-5 mr-3"/> Send a code to your phone (Coming Soon)
              </Button>
            </div>
            
            <Button 
              onClick={handleFinish} 
              className="w-full"
            >
              Finish & Go to Dashboard
            </Button>
          </div>
        </main>
      </div>

      {/* TOTP modal kept for optional enrollment but not required to finish */}
    </>
  );
};

export default SecureWalletScreen;