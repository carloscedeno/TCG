import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Clock, TrendingUp, TrendingDown, Coins } from 'lucide-react';

export const CreditHistoryList: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('credit_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                setHistory(data);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [user]);

    if (loading) {
        return <div className="text-center py-8 text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Cargando Historial...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                <Coins size={32} className="text-slate-700" />
                <p className="text-slate-400 font-bold italic">No tienes movimientos de créditos registrados.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {history.map((record) => (
                <div key={record.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${record.amount > 0 ? 'bg-geeko-cyan/20 text-geeko-cyan' : 'bg-red-500/20 text-red-500'}`}>
                            {record.amount > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">{record.reason}</p>
                            <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                                <Clock size={12} />
                                <span>{new Date(record.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`font-black text-lg ${record.amount > 0 ? 'text-geeko-cyan' : 'text-red-500'}`}>
                        {record.amount > 0 ? '+' : ''}{record.amount} CG
                    </div>
                </div>
            ))}
        </div>
    );
};
