// src/App.jsx
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client – replace with your own URL and anon key (stored in .env)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
    const [session, setSession] = useState(null);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <div style={{ fontFamily: "Inter, sans-serif", padding: "2rem" }}>
            <h1>TCG – Strata Framework Demo</h1>
            {session ? (
                <p>Logged in as {session.user.email}</p>
            ) : (
                <p>Please log in via Supabase Auth (not implemented in this demo).</p>
            )}
        </div>
    );
}
