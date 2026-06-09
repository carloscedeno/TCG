import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Coins, Clock } from 'lucide-react';
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
    
    // History state
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen && userProfile) {
            fetchHistory();
        } else {
            setAmount('');
            setReason('');
            setError(null);
            setHistory([]);
        }
    }, [isOpen, userProfile]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        const { data, error } = await supabase
            .from('credit_history')
            .select(`
                id, amount, reason, created_at,
                admin:profiles!credit_history_admin_id_fkey(username)
            `)
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (!error && data) {
            setHistory(data);
        }
        setLoadingHistory(false);
    };

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
            fetchHistory();
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
            
            <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a] flex-shrink-0">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        <Coins className="text-geeko-gold" />
                        Gestionar <span className="text-geeko-gold">Créditos</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuario Seleccionado</h3>
                            <p className="text-lg font-black text-white">{userProfile.username || 'Usuario sin nombre'}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Actual</h3>
                            <p className="text-lg text-geeko-gold font-black">{userProfile.geek_credits || 0} CG</p>
                        </div>
                    </div>

                    <form id="credits-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-400 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto (+ añadir, - quitar)</label>
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : parseInt(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-geeko-gold focus:ring-1 focus:ring-geeko-gold transition-all"
                                placeholder="Ej: 100 o -50"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivo</label>
                            <input 
                                type="text" 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-geeko-gold focus:ring-1 focus:ring-geeko-gold transition-all"
                                placeholder="Ej: Premio torneo, ajuste manual..."
                                required
                            />
                        </div>
                    </form>

                    <div className="pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Últimos Movimientos ({userProfile.username})</h3>
                        {loadingHistory ? (
                            <p className="text-xs text-slate-500 italic">Cargando historial...</p>
                        ) : history.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">No hay registros previos.</p>
                        ) : (
                            <div className="space-y-2">
                                {history.map(record => (
                                    <div key={record.id} className="bg-black/40 border border-white/5 rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-white truncate max-w-[180px]">{record.reason}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(record.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[9px] text-slate-600 uppercase">
                                                    por {record.admin?.username || 'Admin'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`font-black text-[10px] px-2 py-1 rounded border flex-shrink-0 ${record.amount > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                            {record.amount > 0 ? '+' : ''}{record.amount} CG
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-white/5 bg-[#050505] flex justify-end gap-3 flex-shrink-0">
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
                        className="flex items-center gap-2 px-6 py-2 bg-geeko-gold text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(255,200,0,0.3)]"
                    >
                        {loading ? 'Guardando...' : <><Save size={16} /> Aplicar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
