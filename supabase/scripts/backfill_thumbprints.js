#!/usr/bin/env node
/**
 * Backfill public_thumbprint for profiles and wallets
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node supabase/scripts/backfill_thumbprints.js
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function jwkThumbprintFromObj(jwk) {
  if (!jwk || !jwk.crv || !jwk.kty || !jwk.x || !jwk.y) return null;
  const obj = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  const s = JSON.stringify(obj);
  const digest = crypto.createHash('sha256').update(s, 'utf8').digest('hex');
  return digest.slice(0, 40);
}

async function backfillProfiles() {
  console.log('Fetching profiles with public_key present and missing public_thumbprint...');
  const { data, error } = await supabase.from('profiles').select('id, public_key').is('public_key', null).neq('public_key', null).is('public_thumbprint', null).limit(1000);
  // Above query may not be supported by older Postgres variants; fallback to simple select and filter in JS
  let rows = data || [];
  if (error) {
    console.warn('Profiles query returned error, falling back to broader query', error.message || error);
    const { data: all } = await supabase.from('profiles').select('id, public_key, public_thumbprint').limit(1000);
    rows = (all || []).filter(r => r.public_key && !r.public_thumbprint);
  }

  console.log(`Found ${rows.length} profile(s) to process`);
  for (const r of rows) {
    try {
      const jwk = r.public_key;
      const tp = jwkThumbprintFromObj(jwk);
      if (!tp) {
        console.warn(`Skipping profile ${r.id}: public_key missing expected fields`);
        continue;
      }
      const { error: upErr } = await supabase.from('profiles').update({ public_thumbprint: tp }).eq('id', r.id);
      if (upErr) console.error(`Failed to update profile ${r.id}:`, upErr.message || upErr);
      else console.log(`Updated profile ${r.id} with thumbprint ${tp}`);
    } catch (e) {
      console.error('Profile backfill error', e);
    }
  }
}

async function backfillWallets() {
  console.log('Fetching wallets with public_key present and missing public_thumbprint...');
  const { data, error } = await supabase.from('wallets').select('user_id, public_key').is('public_key', null).neq('public_key', null).is('public_thumbprint', null).limit(1000);
  let rows = data || [];
  if (error) {
    console.warn('Wallets query returned error, falling back to broader query', error.message || error);
    const { data: all } = await supabase.from('wallets').select('user_id, public_key, public_thumbprint').limit(1000);
    rows = (all || []).filter(r => r.public_key && !r.public_thumbprint);
  }

  console.log(`Found ${rows.length} wallet(s) to process`);
  for (const r of rows) {
    try {
      const jwk = r.public_key;
      const tp = jwkThumbprintFromObj(jwk);
      if (!tp) {
        console.warn(`Skipping wallet ${r.user_id}: public_key missing expected fields`);
        continue;
      }
      const { error: upErr } = await supabase.from('wallets').update({ public_thumbprint: tp }).eq('user_id', r.user_id);
      if (upErr) console.error(`Failed to update wallet ${r.user_id}:`, upErr.message || upErr);
      else console.log(`Updated wallet ${r.user_id} with thumbprint ${tp}`);
    } catch (e) {
      console.error('Wallet backfill error', e);
    }
  }
}

async function run() {
  await backfillProfiles();
  await backfillWallets();
  console.log('Backfill complete');
}

run().catch(err => {
  console.error('Backfill failed', err);
  process.exit(1);
});
