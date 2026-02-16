import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Package, ChevronDown, X, User, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderItem {
    id: string;
    quantity: number;
    price_at_purchase: number;
    product: {
        id: string;
        name: string;
        image_url: string;
        set_code: string;
    };
}

const ORDER_STATUSES: Record<string, { label: string; color: string; border?: string }> = {
    pending_payment: { label: 'Pendiente de Pago', color: 'bg-yellow-500/20 text-yellow-400' },
    paid: { label: 'Pagado', color: 'bg-blue-500/20 text-blue-400' },
    processing: { label: 'Procesando', color: 'bg-indigo-500/20 text-indigo-400' },
    ready_for_pickup: { label: 'Listo para Recoger', color: 'bg-purple-500/20 text-purple-400' },
    shipped: { label: 'Enviado', color: 'bg-cyan-500/20 text-cyan-400' },
    delivered: { label: 'Entregado', color: 'bg-emerald-500/20 text-emerald-400' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
    returned: { label: 'Devuelto', color: 'bg-orange-500/20 text-orange-400' },
    refunded: { label: 'Reembolsado', color: 'bg-pink-500/20 text-pink-400' },
    on_hold: { label: 'En Espera', color: 'bg-gray-500/20 text-gray-400' }
};

interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    user_email?: string;
    order_items: OrderItem[];
    deleted_at?: string | null;
}

const OrdersPage = () => {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);


    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showDeleted, setShowDeleted] = useState(false);

    const filteredOrders = orders.filter(order => {
        if (!showDeleted && order.deleted_at) return false;
        if (showDeleted && !order.deleted_at) return false; // Show ONLY deleted if toggled? Or include? usually separate view.
        // Let's make it toggle include/exclude or show/hide.
        // Interpretation: "Soft Delete" usually means hidden by default.
        if (filterStatus !== 'all' && order.status !== filterStatus) return false;
        return true;
    });

    useEffect(() => {
        if (isAdmin) {
            fetchOrders();
        }
    }, [isAdmin]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        quantity,
                        price_at_purchase,
                        product:products (
                            id,
                            name,
                            image_url,
                            set_code
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err: any) {
            console.error("Error fetching orders:", err);
            alert("Error al obtener las órdenes: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        // Confirmation for critical actions
        if (newStatus === 'cancelled' || newStatus === 'returned') {
            if (!confirm(`¿Estás seguro de que deseas cambiar el estado a ${ORDER_STATUSES[newStatus].label}? Esto RESTAURARÁ el stock de los artículos.`)) return;
        } else if (newStatus === 'pending_payment' || newStatus === 'paid') {
            // If restoring from cancelled
            const currentOrder = orders.find(o => o.id === orderId);
            if (currentOrder?.status === 'cancelled' || currentOrder?.status === 'returned') {
                if (!confirm(`Restaurar esta orden DEDUCIRÁ stock. ¿Continuar?`)) return;
            }
        }

        setUpdatingId(orderId);
        try {
            const { data, error } = await supabase.rpc('update_order_status', {
                p_order_id: orderId,
                p_new_status: newStatus
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err: any) {
            alert("Error al actualizar el estado: " + err.message);
            fetchOrders(); // Revert/Refresh
        } finally {
            setUpdatingId(null);
        }
    };

    const toggleExpand = (orderId: string) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    if (!isAdmin) return <div className="p-8 text-white">Acceso Denegado</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Package className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                                Gestión de <span className="text-blue-500">Órdenes</span>
                            </h1>
                        </div>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">
                            Terminal del Sistema v2.1 • {filteredOrders.length} Órdenes
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold uppercase text-neutral-500 flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={showDeleted}
                                    onChange={(e) => setShowDeleted(e.target.checked)}
                                    className="accent-red-500"
                                />
                                Mostrar Eliminados
                            </label>
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-neutral-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-3 rounded-xl border border-white/10 outline-none focus:border-blue-500/50 transition-all hover:bg-white/5 cursor-pointer appearance-none"
                        >
                            <option value="all">TODOS LOS ESTADOS</option>
                            {Object.entries(ORDER_STATUSES).map(([key, config]) => (
                                <option key={key} value={key}>{config.label.toUpperCase()}</option>
                            ))}
                        </select>
                        <Link to="/admin" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                            Volver al Panel
                        </Link>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-neutral-500 animate-pulse">Cargando órdenes...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20 text-neutral-500">No se encontraron órdenes.</div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-white/10 transition-all">
                                {/* Order Summary Row */}
                                <div
                                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-white/5 active:scale-[0.99] transition-all duration-200"
                                    onClick={() => toggleExpand(order.id)}
                                >
                                    <div className="flex items-center gap-6 pointer-events-none"> {/* Prevent text selection blocking click */}
                                        <div className={`p-3 rounded-xl ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {order.status === 'cancelled' ? <X size={24} /> : <Package size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black font-mono tracking-tight text-white">
                                                    #{order.id.slice(0, 8)}
                                                </h3>
                                                <div className="relative group pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => {
                                                            handleStatusChange(order.id, e.target.value);
                                                        }}
                                                        disabled={updatingId === order.id}
                                                        className={`appearance-none pl-3 pr-8 py-1 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer border border-transparent hover:border-white/20 transition-all outline-none ${ORDER_STATUSES[order.status]?.color || 'bg-gray-500/20 text-gray-400'}`}
                                                    >
                                                        {Object.entries(ORDER_STATUSES).map(([key, config]) => (
                                                            <option key={key} value={key} className="bg-neutral-900 text-white">
                                                                {config.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-neutral-400 font-medium">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.created_at).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><User size={12} /> {order.user_id ? order.user_id.slice(0, 8) : 'Invitado'}...</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 pointer-events-auto">
                                        <div className="text-right pointer-events-none">
                                            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-black mb-1">Monto Total</div>
                                            <div className="text-2xl font-black italic font-mono text-white">
                                                ${order.total_amount.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Status Actions Replaced by Dropdown */}
                                            {updatingId === order.id && (
                                                <span className="text-[10px] uppercase text-neutral-500 animate-pulse">Actualizando...</span>
                                            )}

                                            {/* Delete Action */}
                                            {!order.deleted_at && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("¿Estás seguro de que deseas ELIMINAR esta orden? Se ocultará de la vista.")) {
                                                            setDeletingId(order.id);
                                                            supabase.rpc('soft_delete_order', { p_order_id: order.id })
                                                                .then(({ data, error }: { data: any, error: any }) => {
                                                                    if (error) throw error;
                                                                    if (!data.success) throw new Error(data.error);
                                                                    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, deleted_at: new Date().toISOString() } : o));
                                                                })
                                                                .catch((err: any) => alert("Error al eliminar: " + err.message))
                                                                .finally(() => setDeletingId(null));
                                                        }
                                                    }}
                                                    disabled={deletingId === order.id}
                                                    className="p-2 hover:bg-red-500/10 text-neutral-600 hover:text-red-500 rounded-full transition-colors relative z-10"
                                                    title="Eliminar Orden (Soft)"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}

                                            <div className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
                                                <ChevronDown size={20} className={`text-neutral-500 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Details */}
                                {expandedOrderId === order.id && (
                                    <div className="border-t border-white/5 bg-black/40 p-6 animate-in slide-in-from-top-2 duration-200">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                                            <Package size={14} /> Contenido de la Orden
                                        </h4>
                                        {order.order_items && order.order_items.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {order.order_items.map((item) => (
                                                    <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                        {item.product.image_url ? (
                                                            <img
                                                                src={item.product.image_url}
                                                                alt={item.product.name}
                                                                className="w-16 h-24 object-cover rounded-lg shadow-lg"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-24 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600">
                                                                <Package size={20} />
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col justify-between py-1">
                                                            <div>
                                                                <h5 className="font-bold text-sm text-white line-clamp-1">{item.product.name}</h5>
                                                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">{item.product.set_code}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4 mt-2">
                                                                <span className="text-xs bg-white/10 px-2 py-1 rounded font-mono text-white">x{item.quantity}</span>
                                                                <span className="font-mono text-emerald-400 font-bold">${item.price_at_purchase.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-neutral-500 text-sm font-mono italic p-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                                                <AlertCircle size={16} className="inline mr-2 mb-1" />
                                                No se encontraron artículos en el historial de esta orden.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
