import React, { useState } from 'react';
import { supabase } from '../../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

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
