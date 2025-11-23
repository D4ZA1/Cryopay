Create Profile & Wallet Edge Function

What this does
- Listens for Supabase Auth `user.created` webhook POSTs and upserts a `profiles` row and a placeholder `wallets` row for the new user using the service role key.

Why use this
- When users sign up via email confirmation flows the frontend may not immediately have a session or user.id; a server-side handler guarantees `profiles` and `wallets` exist.

Deployment
1. From the Supabase CLI (recommended) or the Web UI, create a new Edge Function named `create_profile_wallet` and deploy the code in this folder.
2. Set environment variables for the function:
   - SUPABASE_SERVICE_ROLE_KEY = your project's service_role key
   - SUPABASE_URL = your project URL (e.g. https://xyz.supabase.co)

3. Configure Auth webhooks (in Supabase Dashboard -> Authentication -> Settings -> Webhooks) to POST `user.created` events to this function's public URL.

Security
- The function uses the service role key; keep it secret.
- Ensure the function URL is configured only to receive Auth webhook events (don't expose it unnecessarily).

Notes
- This implementation uses the REST endpoint (`/rest/v1/...`) with `Prefer: resolution=merge-duplicates` to emulate upsert behavior. You can replace the HTTP calls with supabase-js server client if you prefer.
- If you enable RLS on `profiles` or `wallets`, the service role key bypasses policies; keep the key locked down.
