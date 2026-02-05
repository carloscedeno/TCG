import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Some features may not work in production if not configured in your deployment platform.');
}

// Helper to create a recursive proxy that throws a descriptive error when any property is accessed or called
const createMissingConfigProxy = (path = 'supabase'): any => {
    // We use a function as the target so it's also "callable"
    const target = () => { };
    return new Proxy(target, {
        get: (_target: any, prop: string | symbol) => {
            // Special case for common React/Vite dev tools check or symbols
            if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') return undefined;

            if (prop === 'auth') {
                return {
                    getSession: async () => ({ data: { session: null }, error: null }),
                    onAuthStateChange: (_cb: (event: any, session: any) => void) => {
                        // Return a dummy Subscription-like object
                        return { data: { subscription: { unsubscribe: () => { } } } };
                    },
                    getUser: async () => ({ data: { user: null }, error: null }),
                    signOut: async () => { }
                };
            }

            const newPath = `${path}.${String(prop)}`;
            return createMissingConfigProxy(newPath);
        },
        apply: (_target: any, _thisArg: any, _args: any[]) => {
            console.warn(`Supabase Call Ignored: ${path}() was called but configuration is missing.`);
            return Promise.resolve({ data: null, error: new Error('Supabase not configured') });
        }
    });
};

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMissingConfigProxy();
