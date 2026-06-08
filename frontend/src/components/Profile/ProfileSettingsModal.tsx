import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Phone, Hash, AlertCircle } from 'lucide-react';
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

    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        cedula: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (currentProfile) {
            setFormData({
                username: currentProfile.username || '',
                first_name: currentProfile.first_name || '',
                last_name: currentProfile.last_name || '',
                cedula: currentProfile.cedula || '',
                phone: currentProfile.phone || '',
                address: currentProfile.address || ''
            });
        }
    }, [currentProfile]);

    if (!isOpen || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Nullify empty username to avoid unique constraint error on empty strings if applicable
            const dataToUpdate = {
                ...formData,
                username: formData.username.trim() === '' ? null : formData.username.trim()
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
