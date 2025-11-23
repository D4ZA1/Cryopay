// Supabase Edge Function (Deno) - verify-wallet
// Expects JSON POST: { user_id, public_key, challenge, signature }
// Environment required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// Helper: base64 -> ArrayBuffer
function b64ToBuf(b64: string) {
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export default async function (req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const body = await req.json();
    const { user_id, public_key, challenge, signature } = body as any;
    if (!user_id || !public_key || !challenge || !signature) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });

    // Import public key and verify signature using WebCrypto
    const jwk = public_key as JsonWebKey;
    const pubKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const sigBuf = b64ToBuf(signature);
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, sigBuf, new TextEncoder().encode(challenge));
    if (!ok) return new Response(JSON.stringify({ ok: false, error: 'invalid signature' }), { status: 401 });

    // Update Supabase wallets row to set verified = true using service role key
  // Deno environment variables are available in Supabase Edge Functions. When running locally,
  // ensure you set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.
  // For type-checkers in Node/TS outside of Deno, `Deno` may be undefined; guard accordingly.
  // @ts-ignore
  const SUPABASE_URL = (typeof Deno !== 'undefined' && Deno?.env?.get) ? Deno.env.get('SUPABASE_URL') : process.env.SUPABASE_URL;
  // @ts-ignore
  const SERVICE_KEY = (typeof Deno !== 'undefined' && Deno?.env?.get) ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') : process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) return new Response(JSON.stringify({ ok: false, error: 'server not configured' }), { status: 500 });

    const restUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/wallets?user_id=eq.${encodeURIComponent(user_id)}`;
    const resp = await fetch(restUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ verified: true })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ ok: false, error: 'failed to update wallet', details: text }), { status: 502 });
    }

    const updated = await resp.json();
    return new Response(JSON.stringify({ ok: true, updated }), { status: 200 });
  } catch (err) {
    console.error('verify-wallet error', err);
    return new Response(JSON.stringify({ ok: false, error: (err as any).message || String(err) }), { status: 500 });
  }
}
