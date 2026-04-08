import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Package, ChevronDown, X, User, Calendar, AlertCircle, FileDown } from 'lucide-react';
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
    finish?: string;
    is_on_demand?: boolean;
}

const ORDER_STATUSES: Record<string, { label: string; color: string; border?: string }> = {
    pending_verification: { label: 'Validando Inventario', color: 'bg-orange-500/20 text-orange-400' },
    awaiting_payment: { label: 'Esperando Pago', color: 'bg-yellow-500/20 text-yellow-400' },
    pending_payment: { label: 'Pendiente Antiguo', color: 'bg-yellow-700/20 text-yellow-600' },
    payment_uploaded: { label: 'Pago en Revisión', color: 'bg-lime-500/20 text-lime-400' },
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
    payment_proof_url?: string | null;
    deleted_at?: string | null;
    guest_info?: {
        full_name?: string;
        email?: string;
        phone?: string;
    } | null;
    shipping_address?: {
        full_name?: string;
        address?: string;
        address_line1?: string;
        city?: string;
        state?: string;
        department?: string;
        phone?: string;
        email?: string;
        shipping_method?: string;
        country?: string;
        zip_code?: string;
    } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt HTML generator — admin version, pulls data from Order object
// ─────────────────────────────────────────────────────────────────────────────
function generateOrderReceiptHTML(order: Order) {
    const customerName = order.guest_info?.full_name || order.shipping_address?.full_name || 'No proporcionado';
    const customerPhone = order.guest_info?.phone || order.shipping_address?.phone || 'No proporcionado';
    const customerEmail = order.guest_info?.email || order.shipping_address?.email || 'N/A';
    const statusLabel = ORDER_STATUSES[order.status]?.label || order.status;
    const dateStr = new Date(order.created_at).toLocaleDateString('es-VE', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const itemRows = (order.order_items || []).map(item => {
        const foilBadge = (item.finish === 'foil' || item.finish === 'etched')
            ? `<span style="background:#7c3aed;color:#fff;font-size:9px;font-weight:900;padding:2px 5px;border-radius:3px;letter-spacing:1px;margin-left:6px;">${item.finish.toUpperCase()}</span>`
            : '';
        const demandBadge = item.is_on_demand
            ? `<span style="background:#d97706;color:#fff;font-size:9px;font-weight:900;padding:2px 5px;border-radius:3px;letter-spacing:1px;margin-left:4px;">ENCARGO</span>`
            : '';
        return `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">
            <span style="font-family:monospace;color:#6b7280;margin-right:8px;">x${item.quantity}</span>
            ${item.product?.name || 'Artículo'}${foilBadge}${demandBadge}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-family:monospace;font-weight:700;font-size:14px;color:#00AEB4;">
            $${(item.price_at_purchase * item.quantity).toFixed(2)}
          </td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante #${order.id.slice(0,8)} — Geekorium</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter','Helvetica Neue',Arial,sans-serif; background:#f3f4f6; padding:40px 20px; color:#111827; }
    .page { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; padding:48px 44px; box-shadow:0 4px 32px rgba(0,0,0,0.08); }
    .header { text-align:center; margin-bottom:28px; }
    .logo { font-size:26px; font-weight:900; letter-spacing:-1px; color:#111827; }
    .sub { font-size:12px; color:#9ca3af; letter-spacing:3px; text-transform:uppercase; margin-top:2px; }
    .bar { width:48px; height:4px; background:#00AEB4; border-radius:2px; margin:10px auto 0; }
    .order-box { background:#f0fdfd; border:1px solid #99f6e4; border-radius:10px; padding:14px 18px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; }
    .order-box .lbl { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#0d9488; }
    .order-box .val { font-family:monospace; font-size:13px; font-weight:700; color:#111827; }
    .customer { background:#f9fafb; border-radius:10px; padding:16px 20px; margin-bottom:24px; }
    .section-title { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:2px; color:#9ca3af; margin-bottom:10px; }
    .customer p { font-size:14px; line-height:2; color:#374151; }
    table { width:100%; border-collapse:collapse; }
    thead th { font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:1.5px; color:#9ca3af; border-bottom:2px solid #e5e7eb; padding:0 0 10px 0; text-align:left; }
    thead th:last-child { text-align:right; }
    .total-row td { border-top:2px solid #111827; padding-top:14px; font-size:16px; font-weight:900; color:#111827; }
    .total-row td:last-child { text-align:right; font-family:monospace; }
    .footer { text-align:center; margin-top:32px; padding-top:20px; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; line-height:1.9; }
    .status-pill { display:inline-block; background:#f3f4f6; color:#374151; border:1px solid #d1d5db; border-radius:20px; padding:4px 14px; font-size:11px; font-weight:900; letter-spacing:1px; text-transform:uppercase; margin-top:12px; }
    @media print { body { background:#fff; padding:0; } .page { box-shadow:none; border-radius:0; padding:32px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">Geekorium Shop</div>
      <div class="sub">Comprobante de Orden — Admin</div>
      <div class="bar"></div>
    </div>
    <div class="order-box">
      <span class="lbl">Orden ID</span>
      <span class="val">#${order.id.slice(0,8)} <span style="color:#9ca3af;font-size:11px;">(${order.id})</span></span>
    </div>
    <p class="section-title">Datos del Cliente</p>
    <div class="customer">
      <p><strong style="color:#111827;">Nombre:</strong> ${customerName}</p>
      <p><strong style="color:#111827;">WhatsApp:</strong> ${customerPhone}</p>
      <p><strong style="color:#111827;">Correo:</strong> ${customerEmail}</p>
    </div>
    <p class="section-title">Detalle del Pedido</p>
    <table>
      <thead><tr><th>Artículo</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tbody><tr class="total-row"><td>Total</td><td>$${Number(order.total_amount).toFixed(2)}</td></tr></tbody>
    </table>
    <div class="footer">
      <p>📅 ${dateStr}</p>
      <p>📧 info@geekorium.shop</p>
      <div class="status-pill">${statusLabel}</div>
    </div>
  </div>
  <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),400));</script>
</body></html>`;
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
                        ),
                        finish,
                        is_on_demand
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
                                    <div className="flex items-center gap-6 pointer-events-none w-full md:w-auto">
                                        <div className={`p-3 rounded-xl flex-shrink-0 ${order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {order.status === 'cancelled' ? <X size={24} /> : <Package size={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <h3 className="text-lg font-black font-mono tracking-tight text-white whitespace-nowrap">
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
                                                <span className="flex items-center gap-1"><User size={12} /> {order.user_id ? order.user_id.slice(0, 8) : 'Invitado'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-8 pointer-events-auto mt-4 md:mt-0 justify-between md:justify-end w-full md:w-auto">
                                        <div className="text-right pointer-events-none">
                                            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-black mb-1">Monto Total</div>
                                            <div className="text-2xl font-black italic font-mono text-white">
                                                ${order.total_amount.toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:gap-4">
                                            {/* Verification Action Buttons */}
                                            {order.status === 'pending_verification' && (
                                                <div className="hidden lg:flex items-center gap-2 mr-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'awaiting_payment'); }}
                                                        disabled={updatingId === order.id}
                                                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                                    >
                                                        ✅ OK Stock
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'cancelled'); }}
                                                        disabled={updatingId === order.id}
                                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                                                    >
                                                        ❌ Sin Stock
                                                    </button>
                                                </div>
                                            )}

                                            {/* Status Actions Replaced by Dropdown */}
                                            {updatingId === order.id && (
                                                <span className="text-[10px] uppercase text-neutral-500 animate-pulse hidden md:block">Actualizando...</span>
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

                                {/* Order Details Layout */}
                                {expandedOrderId === order.id && (
                                    <div className="border-t border-white/5 bg-black/40 p-6 animate-in slide-in-from-top-2 duration-200 space-y-8">
                                        
                                        {/* Buyer & Shipping Info */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8 border-b border-white/5">
                                            {/* Contact Details */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                                    <User size={14} /> Información del Comprador
                                                </h4>
                                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-1">Nombre Completo</p>
                                                            <p className="text-sm font-bold text-white">
                                                                {order.guest_info?.full_name || order.shipping_address?.full_name || 'No proporcionado'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-1">Teléfono</p>
                                                            <p className="text-sm font-bold text-white">
                                                                {order.guest_info?.phone || order.shipping_address?.phone || 'No proporcionado'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-1">Correo Electrónico</p>
                                                        <p className="text-sm font-bold text-blue-400">
                                                            {order.guest_info?.email || order.shipping_address?.email || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Shipping Details */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                                                    <Package size={14} /> Detalles de Envío
                                                </h4>
                                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-4">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-1">Dirección de Entrega</p>
                                                        <p className="text-sm font-bold text-white leading-relaxed">
                                                            {order.shipping_address?.address || order.shipping_address?.address_line1 || 'Recojo en tienda / No especificado'}
                                                        </p>
                                                        <p className="text-xs text-neutral-400 mt-1 font-medium">
                                                            {order.shipping_address?.city || order.shipping_address?.state || ''}{order.shipping_address?.department ? `, ${order.shipping_address?.department}` : ''}
                                                            {order.shipping_address?.zip_code ? ` (${order.shipping_address.zip_code})` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-0.5">Método</p>
                                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-md border border-cyan-500/20">
                                                                {order.shipping_address?.shipping_method || 'Envío Standard'}
                                                            </span>
                                                        </div>
                                                        {order.payment_proof_url && (
                                                            <div className="text-right">
                                                                <p className="text-[10px] uppercase font-black text-neutral-500 tracking-widest mb-0.5">Comprobante</p>
                                                                <a
                                                                    href={order.payment_proof_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] font-black uppercase text-lime-400 hover:text-white transition-colors underline decoration-lime-400/30 underline-offset-4"
                                                                >
                                                                    Abrir Adjunto
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Contents */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                                    <Package size={14} /> Contenido de la Orden
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        const html = generateOrderReceiptHTML(order);
                                                        const win = window.open('', '_blank');
                                                        if (win) { win.document.write(html); win.document.close(); }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00AEB4]/10 border border-[#00AEB4]/30 text-[#00AEB4] hover:bg-[#00AEB4]/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    <FileDown size={12} /> Comprobante PDF
                                                </button>
                                            </div>
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
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">{item.product.set_code}</p>
                                                                        {(item.finish === 'foil' || item.finish === 'etched') && (
                                                                            <span className={`text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-widest ${item.finish === 'foil' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'}`}>
                                                                                {item.finish}
                                                                            </span>
                                                                        )}
                                                                        {item.is_on_demand && (
                                                                            <span className="text-[8px] px-1 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/20 font-black uppercase tracking-widest italic">
                                                                                Por Encargo
                                                                            </span>
                                                                        )}
                                                                    </div>
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
