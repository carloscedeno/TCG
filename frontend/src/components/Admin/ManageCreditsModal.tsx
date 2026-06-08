import React, { useState } from 'react';
import { X, Save, AlertCircle, Coins } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface ManageCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: any;
    onSuccess: () => void;
}

export const ManageCreditsModal: React.FC<ManageCreditsModalProps> = ({ isOpen, onClose, userProfile, onSuccess }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !userProfile) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (amount === '' || amount === 0) {
            setError('El monto no puede ser cero.');
            return;
        }
        if (!reason.trim()) {
            setError('Debes especificar un motivo.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: rpcError } = await supabase.rpc('admin_adjust_credits', {
                target_user_id: userProfile.id,
                p_amount: Number(amount),
                p_reason: reason.trim()
            });

            if (rpcError) throw rpcError;

            onSuccess();
            setAmount('');
            setReason('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al ajustar créditos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        <Coins className="text-geeko-gold" />
                        Gestionar <span className="text-geeko-gold">Créditos</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-low hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Usuario Seleccionado</h3>
                        <p className="text-lg font-black text-white">{userProfile.username || 'Usuario sin nombre'}</p>
                        <p className="text-sm text-geeko-cyan mt-1 font-bold">Saldo actual: {userProfile.geek_credits || 0} CG</p>
                    </div>

                    <form id="credits-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Monto (+ para añadir, - para quitar)</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-gold focus:ring-1 focus:ring-geeko-gold transition-all"
                                placeholder="Ej: 100 o -50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Motivo</label>
                            <input 
                                type="text" 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all"
                                placeholder="Ej: Premio torneo, ajuste manual..."
                                required
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-white/5 bg-[#050505] flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="credits-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-geeko-gold text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? 'Guardando...' : <><Save size={16} /> Aplicar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
