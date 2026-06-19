import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Loader2, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/supabaseClient';

interface Movement {
    printing_id: string;
    condition_id: number;
    card_name: string;
    set_code: string;
    previous_price: number;
    current_price: number;
    price_delta: number;
    last_updated: string;
    quantity: number;
}

export const InventoryMovements = () => {
    const { session } = useAuth();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            fetchMovements();
        }
    }, [session?.user?.id]);

    const fetchMovements = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_inventory_movements', {
                p_user_id: session?.user?.id
            });

            if (error) throw error;
            setMovements(data || []);
        } catch (err: any) {
            console.error("Error fetching inventory movements:", err);
            setError(err.message || 'Error cargando movimientos');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#00D1FF]" />
                <p className="text-sm font-medium uppercase tracking-widest">Calculando Variaciones...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-red-400 font-bold mb-2">Error de conexión</p>
                <p className="text-sm text-red-400/80">{error}</p>
                <button 
                    onClick={fetchMovements}
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (movements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-800/30 rounded-xl border border-white/5">
                <Clock className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-bold">Sin Movimientos Recientes</p>
                <p className="text-sm mt-2 text-center max-w-md">
                    Los precios de las cartas en tu inventario no han registrado variaciones significativas en las últimas 24 horas.
                </p>
            </div>
        );
    }

    const totalPortfolioChange = movements.reduce((acc, curr) => acc + (curr.price_delta * curr.quantity), 0);
    const isPositive = totalPortfolioChange >= 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-800/50 rounded-2xl border border-white/5">
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">Fluctuación Diaria</h3>
                    <p className="text-xs text-slate-400 mt-1">Suma del cambio de valor de todas las cartas afectadas</p>
                </div>
                <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border ${
                    isPositive 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                    {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    <span className="text-2xl font-black tracking-tighter">
                        {isPositive ? '+' : ''}{totalPortfolioChange.toFixed(2)} USD
                    </span>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/5">
                            <th className="p-4 font-bold">Carta</th>
                            <th className="p-4 font-bold text-center">Set</th>
                            <th className="p-4 font-bold text-center">Cant.</th>
                            <th className="p-4 font-bold text-right">Ayer</th>
                            <th className="p-4 font-bold text-right">Hoy</th>
                            <th className="p-4 font-bold text-right">Variación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {movements.map((mov, idx) => {
                            const isUp = mov.price_delta > 0;
                            return (
                                <tr key={`${mov.printing_id}-${mov.condition_id}-${idx}`} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-white text-sm">{mov.card_name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">ID: {mov.printing_id.split('-')[0]}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 bg-white/5 rounded-md text-xs font-mono text-slate-300 uppercase">
                                            {mov.set_code}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-sm font-bold text-slate-300">
                                        x{mov.quantity}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 text-sm text-slate-400">
                                            <DollarSign className="w-3 h-3" />
                                            {mov.previous_price.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1 text-sm font-bold text-white">
                                            <DollarSign className="w-3 h-3" />
                                            {mov.current_price.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`inline-flex items-center justify-end gap-1 px-2.5 py-1 rounded text-xs font-bold ${
                                            isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {isUp ? '+' : ''}{mov.price_delta.toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
