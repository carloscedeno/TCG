import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { CheckCircle, Truck, Package, Clock, Upload, Loader2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
    const [paymentFile, setPaymentFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchOrder = async () => {
        try {
            console.log("Fetching order with ID:", orderId);
            if (!orderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
                throw new Error("El ID de la orden no es válido");
            }

            // Attempt 1: Full fetch with items mapping
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setPaymentPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUploadPayment = async () => {
        if (!paymentFile) return;
        setIsUploading(true);
        try {
            const fileExt = paymentFile.name.split('.').pop();
            const fileName = `${orderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload file
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(fileName, paymentFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(uploadData.path);

            const paymentProofUrl = publicUrlData.publicUrl;

            // Update order with the proof url and change status to payment_uploaded
            const { error: rpcError } = await supabase.rpc('update_order_status', {
                p_order_id: orderId,
                p_new_status: 'payment_uploaded'
            });

            if (rpcError) throw rpcError;

            // Update record directly with the URL
            const { error: updateError } = await supabase
                .from('orders')
                .update({ payment_proof_url: paymentProofUrl })
                .eq('id', orderId);

            if (updateError) throw updateError;

            alert('¡Comprobante subido con éxito! El equipo lo verificará en breve.');

            // Refetch
            await fetchOrder();
            setPaymentFile(null);
            setPaymentPreview(null);

        } catch (err: any) {
            console.error('Upload Error:', err);
            alert('Hubo un error al subir tu pago. Asegúrate de intentar nuevamente.');
        } finally {
            setIsUploading(false);
        }
    };

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

                            {/* Payment Upload Section */}
                            {isPaymentRequired && (
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <h3 className="font-black uppercase tracking-widest text-sm mb-4 text-[#00AEB4]">Adjuntar Comprobante</h3>
                                    <p className="text-xs text-neutral-400 mb-4">Sube la captura de tu pago a Zelle o Pago Móvil para que confirmemos tu orden.</p>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {paymentPreview ? (
                                        <div className="space-y-4">
                                            <div className="relative rounded-xl overflow-hidden border border-[#00AEB4]/30 bg-black/20">
                                                <img src={paymentPreview} alt="Comprobante" className="w-full max-h-48 object-contain" />
                                                <button
                                                    onClick={() => {
                                                        setPaymentPreview(null);
                                                        setPaymentFile(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-black/80 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-red-500/80 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <button
                                                onClick={handleUploadPayment}
                                                disabled={isUploading}
                                                className="w-full py-4 bg-[#00AEB4] text-black font-black uppercase rounded-xl hover:bg-[#00c5cc] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isUploading ? <><Loader2 className="animate-spin" size={20} /> Subiendo...</> : <><Upload size={20} /> Enviar Comprobante</>}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#00AEB4]/50 hover:bg-[#00AEB4]/5 transition-all group"
                                        >
                                            <Upload size={24} className="text-neutral-500 group-hover:text-[#00AEB4] transition-colors" />
                                            <div className="text-center">
                                                <span className="text-sm font-bold text-neutral-400 group-hover:text-white transition-colors block">Subir captura o foto</span>
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest">Formatos permitidos: JPG, PNG, PDF</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}

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
                                    <div key={item.id} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="text-neutral-500 font-mono">x{item.quantity}</span>
                                            <span className="font-bold">{item.product_name || `Card ID: ${item.product_id}`}</span>
                                        </div>
                                        <span className="font-mono text-[#00AEB4] font-bold">${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
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
