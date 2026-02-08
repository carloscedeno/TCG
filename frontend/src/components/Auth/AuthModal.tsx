import React, { useState } from 'react';
import { supabase } from '../../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

// Social Icons Components
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const DiscordIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 127.14 96.36">
        <path fill="currentColor" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.24-23.23-13.26-47.57-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
);

const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 23 23">
        <path fill="currentColor" d="M0 0h11v11H0z" />
        <path fill="currentColor" d="M12 0h11v11H12z" />
        <path fill="currentColor" d="M0 12h11v11H0z" />
        <path fill="currentColor" d="M12 12h11v11H12z" />
    </svg>
);

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }: {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register' | 'forgot-password'
}) => {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onClose();
            } else if (mode === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: 'user'
                        }
                    }
                });
                if (error) throw error;
                alert('Verification email sent!');
                onClose();
            } else if (mode === 'forgot-password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password`,
                });
                if (error) throw error;
                setSuccessMessage('Si el correo existe, recibirás un enlace de recuperación.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'discord' | 'azure') => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
                            {mode === 'login' ? <LogIn className="text-blue-400 w-8 h-8" /> :
                                mode === 'register' ? <UserPlus className="text-blue-400 w-8 h-8" /> :
                                    <Lock className="text-blue-400 w-8 h-8" />}
                        </div>
                        <h2 className="text-3xl font-bold text-white">
                            {mode === 'login' ? 'Bienvenido' :
                                mode === 'register' ? 'Crear Cuenta' :
                                    'Recuperar Contraseña'}
                        </h2>
                        <p className="text-slate-400 mt-2 text-center">
                            {mode === 'login' ? 'Accede a tu colección TCG' :
                                mode === 'register' ? 'Únete a la mejor comunidad TCG' :
                                    'Te enviaremos las instrucciones a tu correo'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {mode !== 'forgot-password' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'login' && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setMode('forgot-password')}
                                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm text-center">
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {loading ? 'Procesando...' :
                                mode === 'login' ? 'Iniciar Sesión' :
                                    mode === 'register' ? 'Registrarse' :
                                        'Enviar Enlace'}
                        </button>
                    </form>

                    {mode !== 'forgot-password' && (
                        <>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="h-px bg-slate-800 flex-1"></div>
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">O continuar con</span>
                                <div className="h-px bg-slate-800 flex-1"></div>
                            </div>

                            <div className="mt-6 grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => handleSocialLogin('google')}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex items-center justify-center transition-all hover:border-slate-600"
                                    title="Google"
                                >
                                    <GoogleIcon />
                                </button>
                                <button
                                    onClick={() => handleSocialLogin('discord')}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex items-center justify-center transition-all hover:border-slate-600"
                                    title="Discord"
                                >
                                    <DiscordIcon />
                                </button>
                                <button
                                    onClick={() => handleSocialLogin('azure')}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white p-3 rounded-xl flex items-center justify-center transition-all hover:border-slate-600"
                                    title="Microsoft"
                                >
                                    <MicrosoftIcon />
                                </button>
                            </div>
                        </>
                    )}

                    <div className="mt-8 text-center text-slate-400 text-sm">
                        {mode === 'login' ? (
                            <>
                                ¿No tienes cuenta?
                                <button
                                    onClick={() => setMode('register')}
                                    className="text-blue-400 font-semibold ml-2 hover:underline focus:outline-none"
                                >
                                    Regístrate
                                </button>
                            </>
                        ) : mode === 'register' ? (
                            <>
                                ¿Ya tienes cuenta?
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-blue-400 font-semibold ml-2 hover:underline focus:outline-none"
                                >
                                    Inicia sesión
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setMode('login')}
                                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white mx-auto transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al inicio de sesión
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 flex justify-center border-t border-slate-800">
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-all">
                        Cerrar ventana
                    </button>
                </div>
            </div>
        </div>
    );
};
