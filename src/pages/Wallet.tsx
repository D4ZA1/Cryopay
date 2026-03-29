import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { apiFetch, saveWallet } from '../lib/api';
import { generateKeyPair, exportJwk, encryptJwkWithPassword, jwkThumbprint } from '../lib/crypto';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [publicJwk, setPublicJwk] = useState<JsonWebKey | null>(null);
  const [thumbprint, setThumbprint] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user) return setStatus('You must be signed in');
    setStatus('Generating keypair...');
    try {
      const kp = await generateKeyPair();
      const priv = await exportJwk(kp.privateKey);
      const pub = await exportJwk(kp.publicKey);
      setPublicJwk(pub);
      const tp = await jwkThumbprint(pub);
      setThumbprint(tp);
      setStatus('Keypair generated — enter a password and click Save to store it encrypted');
      // keep private JWK in memory only until saved; store encrypted blob after Save
      (window as any).__cryopay_private_jwk = priv;
    } catch (err) {
      console.error(err);
      setStatus('Failed to generate keys');
    }
  };

  const handleSave = async () => {
    if (!user) return setStatus('You must be signed in');
    if (!password) return setStatus('Enter a password to encrypt the private key (required)');
    const priv: JsonWebKey | undefined = (window as any).__cryopay_private_jwk;
    if (!priv) return setStatus('No private key in memory — generate first');
    setStatus('Encrypting private key...');
    try {
      const encrypted = await encryptJwkWithPassword(priv, password);
      const publicKey = publicJwk || (await exportJwk(await (await generateKeyPair()).publicKey));

      setStatus('Saving to Worker API...');
      // Save to wallet table
      const publicKeyStr = JSON.stringify(publicJwk);
      const encryptedStr = JSON.stringify(encrypted);
      console.log('[Wallet] saving to wallet API:', { publicKeyStr: publicKeyStr.substring(0, 50) + '...', encryptedPresent: !!encryptedStr });
      const response = await saveWallet(publicKeyStr, encryptedStr, false);
      console.log('[Wallet] wallet save response:', response);

      if (!response.ok) {
        console.error('wallet save error', response.error);
        setStatus('Failed to save wallet: ' + response.error);
        return;
      }

      // Also save to profile table
      if (publicJwk) {
        const thumbprint = await jwkThumbprint(publicJwk);
        const publicKeyWithThumb = { jwk: publicJwk, thumbprint };
        console.log('[Wallet] saving to profile API:', { publicKeyPreview: JSON.stringify(publicKeyWithThumb).substring(0, 50) + '...', encryptedPresent: !!encryptedStr });
        const profileRes = await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ 
            public_key: JSON.stringify(publicKeyWithThumb),
            encrypted_private_key: encryptedStr
          }),
        });
        console.log('[Wallet] profile save response:', profileRes);
        if (!profileRes.ok) {
          console.warn('profile update failed', profileRes.error);
        }
      }

      await refreshUser();
      setStatus('Wallet saved (encrypted). You can now confirm ownership on Confirm Key page.');
      // Clear in-memory private key
      delete (window as any).__cryopay_private_jwk;
      setPassword('');
    } catch (err) {
      console.error(err);
      setStatus('Error encrypting or saving the key');
    }
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-slate-400">Generate a new keypair and store the encrypted private key securely. The private key is encrypted locally with a password you provide.</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-6">
          
          {/* Generate Keypair Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Generate Keypair</h2>
              <p className="text-sm text-slate-400 mb-4">Create a new cryptographic key pair for your wallet</p>
              <button 
                onClick={handleGenerate} 
                className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                Generate Keypair
              </button>
            </div>

            {/* Public Key Thumbprint Display */}
            {thumbprint && (
              <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4">
                <label className="text-sm text-slate-400 mb-2 block">Public Key ID</label>
                <code className="bg-black/40 text-emerald-400 px-3 py-2 rounded-lg text-sm block break-all font-mono">
                  {thumbprint}
                </code>
              </div>
            )}
          </div>

          {/* Encryption Password Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Encryption Password</label>
            <input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              type="password" 
              placeholder="Enter a strong password"
              className="w-full bg-slate-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
            <p className="text-xs text-slate-500">This password will be used to encrypt your private key locally</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              Save (encrypt & upload)
            </button>
            <button
              onClick={() => navigate('/confirm-key')}
              className="flex-1 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium rounded-xl transition-all duration-200 border border-white/[0.06]"
            >
              Go to Confirm Key
            </button>
          </div>

          {/* Status Message */}
          {status && (
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-xl p-4">
              <p className="text-sm text-slate-300">{status}</p>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Security Information</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start">
              <span className="text-emerald-400 mr-2">•</span>
              <span>Your private key is encrypted locally before being stored</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-400 mr-2">•</span>
              <span>The encryption password is never sent to the server</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-400 mr-2">•</span>
              <span>Keep your password safe - it cannot be recovered if lost</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
