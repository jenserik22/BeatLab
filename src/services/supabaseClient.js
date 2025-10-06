import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

let client = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { 'x-client-info': 'beatlab-share/1.0' } },
  });
} else if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase credentials are missing; share links will fall back to ?p= links.'
  );
}

export const getSupabaseClient = () => client;
export const hasSupabaseConfig = () => Boolean(client);
