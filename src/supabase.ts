import { createClient } from "@supabase/supabase-js";

// Read Vite env vars (they must be prefixed with VITE_ to be exposed to the client)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fail fast with a clear error during development if env vars are missing
if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		"Missing Supabase environment variables: make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env"
	);
}

export const supabase = createClient(supabaseUrl, supabaseKey);