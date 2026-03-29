import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyWallet, getWallet } from '../lib/api';
import { decryptJwkWithPassword, signString } from '../lib/crypto';
import { Button } from '../components/ui/button';

const ConfirmKey: React.FC = () => {
  const { user } = useAuth();
  const [walletRow, setWalletRow] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const walletRes = await getWallet();
        if (!walletRes.ok) {
          setStatus('Failed to load wallet');
          return;
        }
        setWalletRow(walletRes.data?.wallet || null);
      } catch (error) {
        console.error(error);
        setStatus('Failed to load wallet');
      }
    })();
  }, [user]);

  const handleRequestChallenge = () => {
    // In production, request a server-issued nonce via the Worker API.
    // For now we generate a client-side challenge (not secure) as a placeholder.
    const nonce = 'cryopay:' + Date.now() + ':' + Math.random().toString(36).slice(2);
    setChallenge(nonce);
    setStatus('Challenge created — sign it with your private key');
  };

  const handleSignAndVerify = async () => {
    if (!walletRow) return setStatus('No wallet found');
    if (!password) return setStatus('Enter your encryption password');
    if (!challenge) return setStatus('Create a challenge first');
    setStatus('Decrypting private key...');
    try {
      const privateJwk = await decryptJwkWithPassword(walletRow.encrypted_private_key, password);
      setStatus('Signing challenge...');
      const signature = await signString(privateJwk, challenge);

      setStatus('Sending signature to server for verification...');
      try {
        // Use Worker API verify-wallet endpoint
        const verifyRes = await verifyWallet(walletRow.public_key, challenge, signature);
        if (!verifyRes.ok) {
          console.error('Worker verify error', verifyRes.error);
          setStatus('Server verification failed: ' + (verifyRes.error || 'Unknown error'));
          return;
        }
        setStatus('Wallet verified by server.');
        // Refresh wallet data to get updated verified status
        const walletRes = await getWallet();
        if (walletRes.ok && walletRes.data?.wallet) {
          setWalletRow(walletRes.data.wallet);
        }
      } catch (err) {
        console.error('verify call failed', err);
        setStatus('Verification failed due to network or server error');
      }
    } catch (err) {
      console.error(err);
      setStatus('Failed to decrypt or sign — check your password');
    }
  };

  return (
    <div className="p-6 min-h-screen max-w-[1000px] mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Confirm Key</h1>
      <p className="text-slate-400 mb-6">Verify your wallet ownership by signing a challenge</p>
      {!walletRow && <div className="mb-4 bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 text-slate-400">No wallet found for your account. Create one on the Wallet page.</div>}
      {walletRow && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div><strong className="text-white">Public key id:</strong> <code className="bg-slate-800/50 border border-white/[0.06] text-cyan-400 px-2 py-1 rounded">{walletRow?.public_key?.x?.slice?.(0, 8) || walletRow?.public_key?.slice(0, 20) || 'n/a'}</code></div>
          <div><strong className="text-white">Verified:</strong> <span className={walletRow?.verified ? 'text-emerald-400' : 'text-red-400'}>{walletRow?.verified ? 'Yes' : 'No'}</span></div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Encryption password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full bg-slate-800/50 border border-white/[0.06] text-white placeholder:text-slate-500 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRequestChallenge} variant="outline" className="bg-white/[0.06] border border-white/[0.06] text-white hover:bg-white/[0.1] rounded-xl">Create Challenge</Button>
            <Button onClick={handleSignAndVerify} variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">Sign & Verify</Button>
          </div>
          {challenge && <div className="text-xs text-slate-400">Challenge: <code className="bg-slate-800/50 border border-white/[0.06] text-cyan-400 px-2 py-1 rounded">{challenge}</code></div>}
          {status && (
            <div className={`mt-2 text-sm ${
              status.includes('verified') || status.includes('Wallet verified') 
                ? 'text-emerald-400' 
                : status.includes('Failed') || status.includes('failed') || status.includes('error')
                ? 'text-red-400'
                : 'text-slate-400'
            }`}>{status}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConfirmKey;
