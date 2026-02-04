import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Some features may not work in production if not configured in your deployment platform.');
}

// Create client only if variables are present to avoid startup crash
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : new Proxy({}, {
        get: (_target, prop) => {
            console.error(`Supabase error: Attempted to access property "${String(prop)}" but Supabase environment variables are missing.`);
            return () => { throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.'); };
        }
    }) as any;
