import { createBrowserClient } from '@supabase/ssr';

let client = null;

export function createClient() {
  if (client) return client;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn('Supabase URL or Anon Key is not configured');
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  
  client = createBrowserClient(url, key);
  return client;
}
