import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Clock, AlertCircle, DollarSign, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DebtItem {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    odoo_order_id?: string | null;
    order_items?: {
        product_name: string;
        quantity: number;
    }[];
}

interface DebtsListProps {
    onTotalCalculated?: (total: number) => void;
}

export const DebtsList: React.FC<DebtsListProps> = ({ onTotalCalculated }) => {
    const { user } = useAuth();
    const [debts, setDebts] = useState<DebtItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDebts = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        total_amount,
                        status,
                        created_at,
                        odoo_order_id,
                        order_items (
                            product_name,
                            quantity
                        )
                    `)
                    .eq('user_id', user.id)
                    .in('status', ['pending_payment', 'awaiting_payment', 'pending_verification'])
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setDebts(data as any);
                    const totalSum = data.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
                    if (onTotalCalculated) {
                        onTotalCalculated(totalSum);
                    }
                }
            } catch (err) {
                console.error("Error fetching debts:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDebts();
    }, [user]);

    if (loading) {
        return <div className="text-center py-8 text-slate-500 animate-pulse font-bold uppercase tracking-widest text-xs">Consultando cuentas pendientes...</div>;
    }

    if (debts.length === 0) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                <DollarSign size={32} className="text-emerald-500/50" />
                <p className="text-slate-400 font-bold italic text-sm">¡Excelente! No tienes cuentas ni deudas pendientes de pago.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {debts.map((record) => {
                const titleItem = record.order_items?.[0]?.product_name || `Orden #${record.id.slice(0, 8)}`;
                const refCode = record.odoo_order_id ? `#${record.odoo_order_id}` : `#${record.id.slice(0, 8)}`;

                return (
                    <Link 
                        key={record.id} 
                        to={`/order/${record.id}`}
                        className="group block bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex items-center justify-between hover:bg-red-900/30 hover:border-red-500/40 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 group-hover:scale-105 transition-transform">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                        {refCode}
                                    </span>
                                    <p className="text-white font-bold text-sm line-clamp-1 group-hover:text-red-300 transition-colors">{titleItem}</p>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 text-xs mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(record.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className="text-red-400 font-semibold uppercase text-[10px]">
                                        Pendiente por cobrar en Caja
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="font-black text-xl text-red-400 italic">
                                    ${Number(record.total_amount).toFixed(2)}
                                </div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                    Ver Detalle ➔
                                </span>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 text-slate-500 group-hover:text-red-400 group-hover:bg-red-500/10 transition-all">
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};
