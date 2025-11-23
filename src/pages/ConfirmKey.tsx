import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { decryptJwkWithPassword, signString, verifySignature } from '../lib/crypto';

const ConfirmKey: React.FC = () => {
  const { user } = useAuth();
  const [walletRow, setWalletRow] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle();
      if (error) {
        console.error(error);
        setStatus('Failed to load wallet');
        return;
      }
      setWalletRow(data || null);
    })();
  }, [user]);

  const handleRequestChallenge = () => {
    // In production, request a server-issued nonce via an Edge Function or RPC.
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
        // Use Supabase Edge Function 'verify-wallet' - requires that function to be deployed
        const payload = { user_id: user!.id, public_key: walletRow.public_key, challenge, signature };
        const { error } = await supabase.functions.invoke('verify-wallet', { body: JSON.stringify(payload) });
        if (error) {
          console.error('Edge Function error', error);
          setStatus('Server verification failed; falling back to local verify');
          const ok = await verifySignature(walletRow.public_key, challenge, signature);
          if (!ok) return setStatus('Local signature verification failed');
          // If local verify ok, still mark verified locally
          const { error: updErr } = await supabase.from('wallets').update({ verified: true }).eq('user_id', user!.id);
          if (updErr) {
            console.error(updErr);
            return setStatus('Failed to update verification status');
          }
          setStatus('Wallet verified (local fallback).');
        } else {
          setStatus('Wallet verified by server.');
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
          <div><strong>Public key id:</strong> <code className="bg-slate-100 px-2 rounded">{walletRow?.public_key?.x?.slice?.(0, 8) || 'n/a'}</code></div>
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
