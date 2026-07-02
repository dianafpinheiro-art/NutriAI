import { createClient } from '@supabase/supabase-js';

function cleanEnv(value: string | undefined): string {
  const trimmed = (value || '').replace(/^\uFEFF/, '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/^\uFEFF/, '').trim();
  }
  return trimmed;
}

const supabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
