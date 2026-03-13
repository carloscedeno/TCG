import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Package, ChevronRight, Clock, CheckCircle, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Order {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    pending_payment: { label: 'Pendiente de Pago', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    payment_uploaded: { label: 'Pago en Revisión', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    paid: { label: 'Pagado', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    processing: { label: 'Procesando', icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    ready_for_pickup: { label: 'Listo para Pick Up', icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    shipped: { label: 'Enviado', icon: Truck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    delivered: { label: 'Entregado', icon: CheckCircle, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    cancelled: { label: 'Cancelado', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

const OrdersList: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('id, status, total_amount, created_at')
                    .eq('user_id', user.id)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error('Error fetching user orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    if (loading) {
        return (
            <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-geeko-gold animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Consultando terminal central...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
                <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
                    No tienes pedidos registrados aún
                </p>
                <Link to="/" className="text-[10px] text-geeko-gold uppercase font-black tracking-widest hover:opacity-80 transition-opacity underline decoration-geeko-gold/30 underline-offset-4">
                    Explorar el Emporio
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order) => {
                const config = ORDER_STATUS_CONFIG[order.status] || { 
                    label: order.status, 
                    icon: Package, 
                    color: 'text-slate-400', 
                    bg: 'bg-slate-400/10' 
                };
                const StatusIcon = config.icon;

                return (
                    <Link
                        key={order.id}
                        to={`/order/${order.id}`}
                        className="group block p-6 bg-neutral-900/40 border border-white/5 rounded-[2rem] hover:bg-white/5 transition-all hover:border-white/10 relative overflow-hidden"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                                    <StatusIcon className={config.color} size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-sm font-black font-mono text-white opacity-80">
                                            #{order.id.slice(0, 8)}
                                        </h3>
                                        <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${config.color} ${config.bg} border border-white/5`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                        {new Date(order.created_at).toLocaleDateString('es-ES', { 
                                            day: 'numeric', 
                                            month: 'long', 
                                            year: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">Monto Total</p>
                                    <p className="text-xl font-black font-mono text-white italic">
                                        ${Number(order.total_amount).toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-white/5 text-slate-600 group-hover:text-geeko-gold group-hover:bg-geeko-gold/10 transition-all">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Interactive Background Accent */}
                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl rounded-full ${config.bg.replace('/10', '/30')}`} />
                    </Link>
                );
            })}
            
            <p className="text-[10px] text-center text-geeko-gold uppercase font-black tracking-widest opacity-40 pt-4">
                Los pedidos realizados como invitado se rastrean vía link de WhatsApp enviados a tu correo
            </p>
        </div>
    );
};

export default OrdersList;
