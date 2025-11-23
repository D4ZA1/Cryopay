import { serve } from 'std/server'

// This Edge Function receives a webhook event from Supabase Auth (user.created)
// and upserts a profiles and wallets row for the new user using the
// SUPABASE_SERVICE_ROLE_KEY. Deploy this to your Supabase Edge Functions and
// configure Auth -> Settings -> Webhooks to POST user.created events here.

serve(async (req) => {
  try {
    const body = await req.json();
    // Supabase auth webhooks send an "event" wrapper; adjust depending on your webhook config
    const event = body.event || body;
    // Example payload shape: { event: 'user.created', user: { id, email, user_metadata: { firstName, lastName } } }
    const user = event.user || event.auth?.user || null;
    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: 'no user in payload' }), { status: 400 });
    }

    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    if (!serviceKey || !supabaseUrl) {
      return new Response(JSON.stringify({ error: 'missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' }), { status: 500 });
    }

    // Minimal HTTP upsert to profiles and wallets using the service role key
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    };

    const profile = {
      id: user.id,
      first_name: (user.user_metadata && user.user_metadata.firstName) || null,
      last_name: (user.user_metadata && user.user_metadata.lastName) || null,
      email: user.email || null,
      // If the client provided a public_key in user_metadata (e.g. from secure wallet), include it
      public_key: (user.user_metadata && user.user_metadata.public_key) || null,
      encrypted_private_key: (user.user_metadata && user.user_metadata.encrypted_private_key) || null,
    };

    // Upsert profile
    const resp1 = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(profile),
    });

    if (!resp1.ok) {
      const t = await resp1.text();
      console.error('profiles upsert failed', resp1.status, t);
    }

    // Upsert wallets placeholder
    const wallet = {
      user_id: user.id,
      public_key: null,
      encrypted_private_key: null,
      verified: false,
    };

    const resp2 = await fetch(`${supabaseUrl}/rest/v1/wallets`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(wallet),
    });
    if (!resp2.ok) {
      const t = await resp2.text();
      console.error('wallets upsert failed', resp2.status, t);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('function error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
})
