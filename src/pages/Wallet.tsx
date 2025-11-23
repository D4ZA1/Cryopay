import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { generateKeyPair, exportJwk, encryptJwkWithPassword, jwkThumbprint } from '../lib/crypto';

const Wallet: React.FC = () => {
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
    if (!password) return setStatus('Enter a password to encrypt the private key');
    const priv: JsonWebKey | undefined = (window as any).__cryopay_private_jwk;
    if (!priv) return setStatus('No private key in memory — generate first');
    setStatus('Encrypting private key...');
    try {
      const encrypted = await encryptJwkWithPassword(priv, password);
      const publicKey = publicJwk || (await exportJwk(await (await generateKeyPair()).publicKey));

      setStatus('Saving to Supabase...');
      const { error } = await supabase.from('wallets').upsert(
        {
          user_id: user.id,
          public_key: publicKey,
          encrypted_private_key: encrypted,
          verified: false,
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.error('supabase upsert error', error);
        setStatus('Failed to save wallet: ' + error.message);
        return;
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
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Wallet</h1>
      <p className="mb-4">Generate a new keypair and store the encrypted private key in Supabase. The private key is encrypted locally with a password you provide.</p>
      <div className="space-y-3">
        <button onClick={handleGenerate} className="btn btn-primary">Generate Keypair</button>
        {thumbprint && <div className="text-sm text-slate-600">Public key id: <code className="bg-slate-100 px-2 rounded">{thumbprint}</code></div>}
        <div>
          <label className="block text-sm font-medium">Encryption password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" className="mt-1 block w-full rounded border px-3 py-2" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="btn btn-success">Save (encrypt & upload)</button>
          <a href="/confirm-key" className="btn btn-ghost">Go to Confirm Key</a>
        </div>
        {status && <div className="mt-3 text-sm text-slate-700">{status}</div>}
      </div>
    </div>
  );
};

export default Wallet;
