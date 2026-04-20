import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// For server-side operations that might need bypass RLS (like verifying licenses),
// we might eventually need the service role key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
