import React, { useState } from 'react';
import { supabase } from '../../context/AuthContext';
import { LogIn, UserPlus, Github, Mail, Lock } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }: {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register'
}) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: 'user' // Default role
                        }
                    }
                });
                if (error) throw error;
                alert('Verification email sent!');
            }
            onClose();
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
                            {mode === 'login' ? <LogIn className="text-blue-400 w-8 h-8" /> : <UserPlus className="text-blue-400 w-8 h-8" />}
                        </div>
                        <h2 className="text-3xl font-bold text-white">
                            {mode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}
                        </h2>
                        <p className="text-slate-400 mt-2">
                            {mode === 'login' ? 'Accede a tu colección TCG' : 'Únete a la mejor comunidad TCG'}
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

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="h-px bg-slate-800 flex-1"></div>
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">O continuar con</span>
                        <div className="h-px bg-slate-800 flex-1"></div>
                    </div>

                    <div className="mt-6">
                        <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-3 transition-all">
                            <Github className="w-5 h-5" />
                            GitHub
                        </button>
                    </div>

                    <p className="mt-8 text-center text-slate-400 text-sm">
                        {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-blue-400 font-semibold ml-2 hover:underline focus:outline-none"
                        >
                            {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                        </button>
                    </p>
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
