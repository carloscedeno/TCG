import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../context/AuthContext';
import { Mail, Lock, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'forgot-password' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/admin'); // Redirect to admin after successful login
            } else if (mode === 'forgot-password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/update-password`,
                });
                if (error) throw error;
                setSuccessMessage('Si el correo existe, recibirás un enlace de recuperación.');
            } else if (mode === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { role: 'user' } }
                });
                if (error) throw error;
                setSuccessMessage('¡Correo de verificación enviado! Revisa tu bandeja de entrada.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]" />

            <div className="w-full max-w-md relative z-10">
                {/* Back to Home Link */}
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Volver a la Tienda</span>
                </button>

                <div className="bg-neutral-900/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 sm:p-10">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-20 h-20 bg-geeko-cyan/10 rounded-3xl flex items-center justify-center mb-6 border border-geeko-cyan/20 ring-4 ring-geeko-cyan/5">
                            <Shield className="text-geeko-cyan w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-tight">
                            Acceso <span className="text-geeko-cyan">Geekorium</span>
                        </h1>
                        <p className="text-neutral-500 mt-3 text-sm font-medium">
                            {mode === 'login' ? 'Panel de Administración y Control' :
                             mode === 'forgot-password' ? 'Recuperar acceso al Emporio' :
                             'Crear cuenta de colaborador'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-geeko-cyan transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-geeko-cyan/30 focus:border-geeko-cyan/40 transition-all font-medium"
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {mode !== 'forgot-password' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-geeko-cyan transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-geeko-cyan/30 focus:border-geeko-cyan/40 transition-all font-medium"
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
                                    className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center animate-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} />
                                {successMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-geeko-cyan hover:text-white font-black py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] uppercase text-xs tracking-[0.2em]"
                        >
                            {loading ? 'Procesando...' :
                                mode === 'login' ? 'Identificarse' :
                                mode === 'forgot-password' ? 'Recuperar' :
                                'Confirmar'}
                        </button>
                    </form>

                    <div className="mt-10 text-center border-t border-white/5 pt-8">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
                            {mode === 'login' ? (
                                <>
                                    ¿Necesitas una cuenta?
                                    <button
                                        onClick={() => setMode('register')}
                                        className="text-white ml-2 hover:text-geeko-cyan transition-colors"
                                    >
                                        Registrarse
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setMode('login')}
                                    className="text-white hover:text-geeko-cyan transition-colors"
                                >
                                    Ir al Inicio de Sesión
                                </button>
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.3em]">
                        &copy; 2026 Geekorium TCG Emporio
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
