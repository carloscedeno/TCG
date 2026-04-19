import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { CheckCircle, Truck, Package, Clock, Loader2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = async () => {
        try {
            console.log("Fetching order with ID:", orderId);
            if (!orderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
                throw new Error("El ID de la orden no es válido");
            }

            // Attempt 1: Full fetch with items mapping
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*, product:products(name, set_code, image_url))')
                .eq('id', orderId)
                .single();

            if (error) {
                console.warn("Initial fetch with items failed:", error);

                // Attempt 2: Fallback fetch - just the order, no join
                // (Useful if the join fails due to RLS or schema mismatch on order_items)
                console.log("Attempting fallback fetch without order_items join...");
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (fallbackError) {
                    console.error("Fallback fetch also failed:", fallbackError);
                    throw fallbackError;
                }

                if (fallbackData) {
                    console.log("Fallback fetch succeeded! The issue is likely the order_items join.");
                    setOrder({ ...fallbackData, order_items: [] });
                    return;
                }
            }

            if (!data) throw new Error("Orden no encontrada");

            console.log("Order fetched successfully:", data);
            setOrder(data);
        } catch (err: any) {
            console.error("OrderTracking Error:", err);
            setError(err.message || 'Error al cargar la orden');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);


    if (loading) return (
        <div className="min-h-[100dvh] bg-[#1F182D] flex items-center justify-center text-white">
            <Loader2 className="animate-spin text-[#00AEB4]" size={40} />
        </div>
    );

    if (error || !order) return (
        <div className="min-h-[100dvh] bg-[#1F182D] flex items-center justify-center text-white p-6">
            <div className="text-center max-w-md w-full bg-[#281F3E] p-8 rounded-2xl border border-white/10">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h1 className="text-2xl font-black mb-2">Orden no encontrada</h1>
                <p className="text-neutral-400 mb-6">{error}</p>
                <Link to="/" className="inline-block px-6 py-3 bg-[#00AEB4] text-black font-black uppercase rounded-xl hover:bg-[#00c5cc] transition-colors">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending_payment': return { text: 'Esperando Pago', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Clock, desc: 'Las cartas están separadas. Por favor adjunta tu pago.' };
            case 'payment_uploaded': return { text: 'Pago en Revisión', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: ShieldCheck, desc: 'Estamos verificando tu pago con el banco.' };
            case 'paid': return { text: 'Pago Confirmado', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle, desc: 'Tu orden está pagada.' };
            case 'processing': return { text: 'Preparando Empaque', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Package, desc: 'Estamos preparando tu envío.' };
            case 'ready_for_pickup': return { text: 'Listo para Pick Up', color: 'text-[#00AEB4]', bg: 'bg-[#00AEB4]/10', icon: CheckCircle, desc: 'Te esperamos en la tienda física.' };
            case 'shipped': return { text: 'Enviado', color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Truck, desc: 'Tu orden ya va en camino.' };
            case 'delivered': return { text: 'Entregado', color: 'text-gray-400', bg: 'bg-gray-400/10', icon: CheckCircle, desc: 'Esperamos lo disfrutes.' };
            case 'cancelled': return { text: 'Cancelado / Expirado', color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle, desc: 'La orden fue anulada por falta de pago o manualmente.' };
            default: return { text: 'En Espera', color: 'text-neutral-400', bg: 'bg-neutral-800', icon: Clock, desc: 'Procesando tu requerimiento.' };
        }
    };

    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;
    const isPaymentRequired = order.status === 'pending_payment';

    return (
        <div className="min-h-[100dvh] bg-[#1F182D] text-white pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link to="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-bold text-sm">
                        <ArrowLeft size={16} /> Volver a la Tienda
                    </Link>
                    <Link to="/profile" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-bold text-sm">
                        <Package size={16} /> Mis Pedidos
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Status info & Payment */}
                    <div className="space-y-6">
                        <div className="bg-[#281F3E] border border-white/10 rounded-2xl p-6 sm:p-8">
                            <h1 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center justify-between">
                                Rastrear Orden
                                <span className="font-mono text-xs text-neutral-500 lowercase px-2 py-1 bg-black/40 rounded-lg">#{order.id.slice(0, 8)}</span>
                            </h1>

                            <div className={`p-5 rounded-xl border flex items-start gap-4 ${statusInfo.bg} ${statusInfo.color.replace('text-', 'border-')}/30`}>
                                <StatusIcon className={statusInfo.color} size={32} />
                                <div>
                                    <h3 className={`font-black uppercase tracking-wider mb-1 ${statusInfo.color}`}>{statusInfo.text}</h3>
                                    <p className="text-sm text-neutral-300">{statusInfo.desc}</p>
                                </div>
                            </div>

                            {/* Payment Upload Section - Hidden per user request to save quota */}
                            {/* 
                            {isPaymentRequired && (
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <h3 className="font-black uppercase tracking-widest text-sm mb-4 text-[#00AEB4]">Adjuntar Comprobante</h3>
                                    ...
                                </div>
                            )} 
                            */}

                            {order.payment_proof_url && !isPaymentRequired && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-[#00AEB4] hover:text-white transition-colors">
                                        <ShieldCheck size={16} /> Ver comprobante adjunto
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Details */}
                    <div className="space-y-6">
                        <div className="bg-[#281F3E]/60 border border-white/5 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-sm font-black uppercase tracking-tight mb-4 border-b border-white/5 pb-4">Detalles del Cliente</h3>
                            <div className="space-y-2 text-xs">
                                <p><span className="text-neutral-500 font-bold w-20 inline-block">Nombre:</span> {order.shipping_address?.full_name}</p>
                                <p><span className="text-neutral-500 font-bold w-20 inline-block">Cédula:</span> {order.shipping_address?.zip_code}</p>
                                <p><span className="text-neutral-500 font-bold w-20 inline-block">Contacto:</span> {order.shipping_address?.phone || order.guest_info?.phone}</p>
                                <p><span className="text-neutral-500 font-bold w-20 inline-block">Destino:</span> {order.shipping_address?.city}, {order.shipping_address?.country}</p>
                                <p><span className="text-neutral-500 font-bold w-20 inline-block align-top">Dirección:</span> <span className="inline-block max-w-[200px]">{order.shipping_address?.address_line1}</span></p>
                            </div>

                            <h3 className="text-sm font-black uppercase tracking-tight mt-6 mb-4 border-b border-white/5 pb-4">Productos</h3>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {(order.order_items || []).map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center text-xs py-1">
                                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-neutral-500 font-mono shrink-0">x{item.quantity}</span>
                                                <span className="font-bold truncate">{item.product?.name || item.product_name || `Card ID: ${item.product_id}`}</span>
                                                {item.product?.set_code && <span className="text-[10px] text-neutral-500 font-bold uppercase ml-1">[{item.product.set_code}]</span>}
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-6">
                                                {(item.finish === 'foil' || item.finish === 'etched') && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest shadow-sm ${item.finish === 'foil' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                                                        {item.finish}
                                                    </span>
                                                )}
                                                {item.is_on_demand && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-black uppercase tracking-widest italic">
                                                        Por Encargo
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-mono text-[#00AEB4] font-bold shrink-0 ml-4">${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-end">
                                <span className="text-xs font-black uppercase tracking-tight">Total Cancelado</span>
                                <span className="text-2xl font-black font-mono">${Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
