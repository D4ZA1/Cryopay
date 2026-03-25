import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyWallet, getWallet } from '../lib/api';
import { decryptJwkWithPassword, signString } from '../lib/crypto';

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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Confirm Key</h1>
      {!walletRow && <div className="mb-4">No wallet found for your account. Create one on the Wallet page.</div>}
      {walletRow && (
        <div className="space-y-3">
          <div><strong>Public key id:</strong> <code className="bg-slate-100 px-2 rounded">{walletRow?.public_key?.x?.slice?.(0, 8) || walletRow?.public_key?.slice(0, 20) || 'n/a'}</code></div>
          <div><strong>Verified:</strong> {walletRow?.verified ? 'Yes' : 'No'}</div>
          <div>
            <label className="block text-sm font-medium">Encryption password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleRequestChallenge} className="btn">Create Challenge</button>
            <button onClick={handleSignAndVerify} className="btn btn-primary">Sign & Verify</button>
          </div>
          {challenge && <div className="text-xs text-slate-600">Challenge: <code className="bg-slate-100 px-2 rounded">{challenge}</code></div>}
          {status && <div className="mt-2 text-sm">{status}</div>}
        </div>
      )}
    </div>
  );
};

export default ConfirmKey;
