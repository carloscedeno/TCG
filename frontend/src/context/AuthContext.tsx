import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
export { supabase };

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        console.log('DEBUG: AuthContext initializing...');
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            console.log('DEBUG: Auth session fetched:', session?.user?.id || 'no-session');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdmin(session.user);
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdmin(session.user);
            } else {
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkAdmin = async (currentUser: User) => {
        try {
            // First check app_metadata (fastest)
            const metadataRole = currentUser.app_metadata?.role?.toString().toLowerCase();
            if (metadataRole === 'admin') {
                setIsAdmin(true);
                setLoading(false);
                return;
            }

            // Fallback: Check public.profiles table
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentUser.id)
                .single();

            if (error) {
                console.warn('Error checking admin role in profiles:', error);
                setIsAdmin(false);
            } else {
                setIsAdmin(data?.role?.toString().toLowerCase() === 'admin');
            }
        } catch (err) {
            console.error('Fatal error in checkAdmin:', err);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
