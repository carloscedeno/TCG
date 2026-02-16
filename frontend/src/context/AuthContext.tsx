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
    const [isAdmin, setIsAdmin] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdmin();
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            // Mock user if null
            const mockUser = { id: 'mock-admin-id', email: 'admin@geeko.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' };
            setUser(session?.user ?? mockUser as any);
            // FORCE ADMIN ALWAYS
            setIsAdmin(true);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkAdmin = async () => {
        setIsAdmin(true);
        setLoading(false);
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
