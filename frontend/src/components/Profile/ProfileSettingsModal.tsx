import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Phone, Hash, AlertCircle, Camera, Lock, Key, Mail } from 'lucide-react';
import { uploadUserAvatar, updateUserPassword, sendPasswordResetEmail } from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: any;
    onProfileUpdated: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, currentProfile, onProfileUpdated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        cedula: '',
        phone: '',
        address: '',
        wizards_email: '',
        pokemon_id: '',
        bandai_id: ''
    });

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                username: currentProfile.username || '',
                first_name: currentProfile.first_name || '',
                last_name: currentProfile.last_name || '',
                cedula: currentProfile.cedula || '',
                phone: currentProfile.phone || '',
                address: currentProfile.address || '',
                wizards_email: currentProfile.wizards_email || '',
                pokemon_id: currentProfile.pokemon_id || '',
                bandai_id: currentProfile.bandai_id || ''
            });
            setAvatarPreview(currentProfile.avatar_url || null);
        }
    }, [currentProfile]);

    if (!isOpen || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            setError(null);
            setSuccess(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            let avatarUrl = currentProfile?.avatar_url;
            if (avatarFile) {
                avatarUrl = await uploadUserAvatar(avatarFile, user.id);
            }

            // Nullify empty fields to avoid unique/validation constraint errors
            const dataToUpdate = {
                ...formData,
                avatar_url: avatarUrl,
                username: formData.username.trim() === '' ? null : formData.username.trim(),
                wizards_email: formData.wizards_email.trim() === '' ? null : formData.wizards_email.trim(),
                pokemon_id: formData.pokemon_id.trim() === '' ? null : formData.pokemon_id.trim(),
                bandai_id: formData.bandai_id.trim() === '' ? null : formData.bandai_id.trim()
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(dataToUpdate)
                .eq('id', user.id);

            if (updateError) {
                if (updateError.code === '23505' && updateError.message.includes('username')) {
                    throw new Error('El nombre de usuario ya está en uso. Por favor elige otro.');
                }
                throw updateError;
            }

            setSuccess(true);
            onProfileUpdated();
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'Error al guardar los cambios.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden.');
            return;
        }

        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            await updateUserPassword(password);
            setPasswordSuccess(true);
            setPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.message || 'Error al actualizar contraseña.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSendResetEmail = async (e: React.MouseEvent) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            if (!user.email) throw new Error('No se encontró el correo del usuario.');
            await sendPasswordResetEmail(user.email);
            setPasswordSuccess(true);
        } catch (err: any) {
            setPasswordError(err.message || 'Error al enviar correo de recuperación.');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        Ajustes de <span className="text-geeko-cyan">Perfil</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-low hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto p-6 custom-scrollbar">
                    <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Status Messages */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-green-400 text-sm font-bold text-center">¡Perfil actualizado correctamente!</p>
                            </div>
                        )}

                        {/* Avatar Upload */}
                        <div className="flex items-center gap-6 pb-4 border-b border-white/5">
                            <div className="relative group w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border-2 border-white/10 flex-shrink-0">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <User size={32} className="text-slate-500" />
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <Camera size={20} className="text-white mb-1" />
                                    <span className="text-[9px] font-black uppercase text-white tracking-widest">Cambiar</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white mb-1">Foto de Perfil</h3>
                                <p className="text-xs text-slate-400">Recomendado: 400x400px. JPG, PNG o GIF.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] border-b border-white/5 pb-2">Información de Usuario</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre de Usuario (Único)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={14} className="text-geeko-cyan" />
                                        </div>
                                        <input 
                                            type="text" 
                                            name="username"
                                            value={formData.username}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-cyan focus:ring-1 focus:ring-geeko-cyan transition-all"
                                            placeholder="ej. cyber_geek"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Cédula / Documento</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Hash size={14} className="text-slate-500" />
                                        </div>
                                        <input 
                                            type="text" 
                                            name="cedula"
                                            value={formData.cedula}
                                            onChange={handleChange}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                            placeholder="V-12345678"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre(s)</label>
                                    <input 
                                        type="text" 
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Apellido(s)</label>
                                    <input 
                                        type="text" 
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] border-b border-white/5 pb-2">Identificaciones de Jugador TCG</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Wizards Account Email</label>
                                    <input 
                                        type="email" 
                                        name="wizards_email"
                                        value={formData.wizards_email}
                                        onChange={handleChange}
                                        placeholder="ejemplo@wizards.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Para MTG Arena / Torneos</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Play! Pokémon ID</label>
                                    <input 
                                        type="text" 
                                        name="pokemon_id"
                                        value={formData.pokemon_id}
                                        onChange={handleChange}
                                        placeholder="ej. 1234567"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Para Torneos Pokémon</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Bandai TCG+ ID</label>
                                    <input 
                                        type="text" 
                                        name="bandai_id"
                                        value={formData.bandai_id}
                                        onChange={handleChange}
                                        placeholder="ej. B-12345"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Para One Piece, DB, Digimon</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] border-b border-white/5 pb-2">Datos de Contacto y Envío</h3>
                            
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Teléfono</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone size={14} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        placeholder="+58 412 1234567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Dirección de Envío Principal</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <MapPin size={14} className="text-slate-500" />
                                    </div>
                                    <textarea 
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all resize-none"
                                        placeholder="Ej. Av. Principal, Residencia Geeko, Apto 4..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] border-b border-white/5 pb-2">Seguridad y Acceso</h3>
                            
                            {passwordError && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-bold">
                                    ¡Acción de seguridad ejecutada con éxito!
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Nueva Contraseña</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock size={14} className="text-slate-500" />
                                        </div>
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock size={14} className="text-slate-500" />
                                        </div>
                                        <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                            placeholder="Repite la contraseña"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={passwordLoading || !password}
                                    onClick={handlePasswordUpdate}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5 disabled:opacity-40"
                                >
                                    <Key size={14} />
                                    Cambiar Contraseña
                                </button>
                                <button
                                    type="button"
                                    disabled={passwordLoading}
                                    onClick={handleSendResetEmail}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5 disabled:opacity-40"
                                >
                                    <Mail size={14} />
                                    Enviar Enlace de Recuperación
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-[#050505] sticky bottom-0 flex justify-end gap-3 z-10">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="profile-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 bg-geeko-cyan text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(0,209,255,0.4)]"
                    >
                        {loading ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
