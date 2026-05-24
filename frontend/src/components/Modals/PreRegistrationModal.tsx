import React, { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { registerForEvent } from '../../utils/api';

interface PreRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
}

export const PreRegistrationModal: React.FC<PreRegistrationModalProps> = ({ isOpen, onClose, event }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await registerForEvent({
                event_id: event.id,
                ...formData
            });
            setSuccess(true);
            // In a real app, the backend or a Supabase Edge Function would send the email here.
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition-colors z-20">
                    <X size={20} />
                </button>

                {success ? (
                    <div className="p-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={40} className="text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">¡Pre-inscripción Exitosa!</h3>
                            <p className="text-neutral-500 text-sm">
                                Hemos recibido tus datos para <strong>{event.name}</strong>. 
                                Te hemos enviado un correo de confirmación. ¡Nos vemos pronto!
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-full py-4 bg-emerald-600 hover:bg-white text-white font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">Inscripción a Misión</h3>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-tight">{event.name}</h2>
                        </div>

                        {event.description && (
                            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl max-h-[120px] overflow-y-auto custom-scrollbar">
                                <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
                                    {event.description}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Nombre Completo</label>
                                <input 
                                    required
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    placeholder="Ej: Carlos Cedeño"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/50 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Correo Electrónico</label>
                                <input 
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="tu@email.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/50 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Teléfono / WhatsApp</label>
                                <input 
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+58 412 0000000"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-white/50 transition-all"
                                />
                            </div>

                            {error && (
                                <p className="text-red-500 text-[10px] font-bold uppercase text-center">{error}</p>
                            )}

                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    'Completar Pre-inscripción'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
