import React, { useState } from 'react';
import { supabase } from '../../context/AuthContext';
import { LogIn, UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }: {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register' | 'forgot-password'
}) => {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'success'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [docType, setDocType] = useState('V');
    const [docNumber, setDocNumber] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
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
                if (password !== confirmPassword) {
                    throw new Error("Las contraseñas no coinciden");
                }
                const spaceIndex = fullName.indexOf(' ');
                const firstName = spaceIndex !== -1 ? fullName.substring(0, spaceIndex) : fullName;
                const lastName = spaceIndex !== -1 ? fullName.substring(spaceIndex + 1) : '';

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                            role: 'user',
                            first_name: firstName,
                            last_name: lastName,
                            cedula: `${docType}-${docNumber}`,
                            phone: phone
                        }
                    }
                });
                if (error) throw error;
                setMode('success');
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
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col transition-all">
                <div className="p-8 overflow-y-auto">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
                            {mode === 'login' ? <LogIn className="text-blue-400 w-8 h-8" /> :
                                mode === 'register' ? <UserPlus className="text-blue-400 w-8 h-8" /> :
                                    mode === 'success' ? <Mail className="text-green-400 w-8 h-8" /> :
                                        <Lock className="text-blue-400 w-8 h-8" />}
                        </div>
                        <h2 className="text-3xl font-bold text-white text-center">
                            {mode === 'login' ? 'Bienvenido' :
                                mode === 'register' ? 'Crear Cuenta' :
                                    mode === 'success' ? '¡Revisa tu Correo!' :
                                        'Recuperar Contraseña'}
                        </h2>
                        <p className="text-slate-400 mt-2 text-center px-4">
                            {mode === 'login' ? 'Accede a tu colección TCG' :
                                mode === 'register' ? 'Únete a la mejor comunidad TCG' :
                                    mode === 'success' ? 'Hemos enviado una misiva mágica a tu correo.' :
                                        'Te enviaremos las instrucciones a tu correo'}
                        </p>
                    </div>

                    {mode === 'success' ? (
                        <div className="text-center space-y-6 pb-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 shadow-inner">
                                <p className="text-green-400 text-sm leading-relaxed">
                                    Por favor, revisa tu bandeja de entrada (y tu carpeta de spam, por si los duendes la escondieron) para confirmar tu cuenta y completar tu registro en <strong>Geekorium</strong>.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                            >
                                Entendido
                            </button>
                        </div>
                    ) : (
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

                        {mode === 'register' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <label className="text-sm font-medium text-slate-300 ml-1">Confirmar contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        placeholder="Repite tu contraseña"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="flex gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="w-1/3 space-y-2">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Tipo</label>
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    >
                                        <option value="V">V</option>
                                        <option value="E">E</option>
                                        <option value="J">J</option>
                                    </select>
                                </div>
                                <div className="w-2/3 space-y-2">
                                    <label className="text-sm font-medium text-slate-300 ml-1">Nº Documento</label>
                                    <input
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value)}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        placeholder="12345678"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <label className="text-sm font-medium text-slate-300 ml-1">Nombre y apellido</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    placeholder="Carlos Cedeño"
                                    required
                                />
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <label className="text-sm font-medium text-slate-300 ml-1">Celular</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    placeholder="04241234567"
                                    required
                                />
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
                    )}

                    {mode !== 'success' && (
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
                    )}
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
