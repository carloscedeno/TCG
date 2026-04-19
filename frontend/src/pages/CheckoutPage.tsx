import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCart, createOrder, sendCheckoutEmailNotification } from '../utils/api';
import {
    Truck,
    MessageCircle,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cartId, setCartId] = useState<string | null>(null);

    // Customer form (Simplified to Name and Phone)
    const [form, setForm] = useState({
        full_name: '',
        whatsapp: '',
        // Hidden fields for DB compatibility
        cedula_prefix: 'V' as 'V' | 'E',
        cedula_number: '',
        state: 'Distrito Capital',
        country: 'Venezuela',
        address: 'Tienda Geekorium (Pick Up)',
        email: '',
        shipping_method: 'pickup' as const,
    });

    useEffect(() => {
        const loadCart = async () => {
            setLoading(true);
            try {
                const cartData = await fetchCart();
                if (!cartData.items || cartData.items.length === 0) {
                    navigate('/');
                    return;
                }
                setCartItems(cartData.items);
                setCartId(cartData.id || null);
            } catch (error) {
                console.error('Error loading cart:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, [navigate]);

    const isFormValid = () => {
        const nameValid = form.full_name.trim().length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.full_name.trim());
        const phoneDigits = form.whatsapp.replace(/\D/g, '');
        const phoneValid = /^0(414|424|412|416|426|2\d{2})\d{7}$/.test(phoneDigits);
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
        return nameValid && phoneValid && emailValid;
    };

    const handleDownloadPDF = () => {
        window.print();
    };

    const handlePlaceOrder = async () => {
        if (!isFormValid()) {
            setValidationError('Por favor ingresa tu nombre completo y un número de teléfono válido.');
            return;
        }

        setIsProcessing(true);
        setValidationError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const total = Array.isArray(cartItems)
                ? cartItems.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0)
                : 0;

            const simplifiedItems = cartItems.map(item => ({
                product_id: item.product_id,
                printing_id: item.printing_id,
                quantity: item.quantity,
                name: item.products?.name,
                set: item.products?.set_code,
                price: item.products?.price || 0,
                foil: item.products?.is_foil || item.products?.finish === 'foil' || false,
                finish: item.products?.finish || (item.products?.is_foil ? 'foil' : 'nonfoil'),
                is_on_demand: (item.products?.stock || 0) <= 0
            }));

            const cedula = `${form.cedula_prefix}-${form.cedula_number || '00000000'}`;

            const orderResponse = await createOrder({
                userId: user?.id || null,
                items: simplifiedItems,
                shippingAddress: {
                    full_name: form.full_name,
                    address_line1: form.address,
                    city: 'Caracas',
                    state: form.state,
                    zip_code: cedula,
                    country: 'VE',
                    email: form.email || 'guest@geekorium.com',
                    phone: form.whatsapp
                },
                totalAmount: total,
                guestInfo: !user ? { email: form.email || 'guest@geekorium.com', phone: form.whatsapp } : undefined,
                cartId: cartId || undefined
            });

            let orderIdForMsg = 'PENDIENTE';
            if (orderResponse) {
                const resObj = Array.isArray(orderResponse) ? orderResponse[0] : orderResponse;
                if (resObj?.success === false) {
                    throw new Error(resObj.error || 'Error desconocido al crear la orden');
                }
                orderIdForMsg = resObj?.order_id || resObj?.id || (typeof orderResponse === 'string' ? orderResponse : 'PENDIENTE');
            }

            // WhatsApp Redirection
            const WA_NUMBER = '584242507802';
            const items = Array.isArray(cartItems) ? cartItems : [];

            // Build per-card detail lines (max 40 items per AGENTS.md lesson #84)
            const itemLines = items.slice(0, 40).map((item) => {
                const name = item.products?.name || 'Carta';
                const qty = item.quantity || 1;
                const unitPrice = (item.products?.price || 0);
                const lineTotal = (unitPrice * qty).toFixed(2);
                const finish = item.products?.finish || (item.products?.is_foil ? 'foil' : 'nonfoil');
                const finishLabel = (finish === 'foil' || finish === 'etched') ? ' [FOIL]' : '';
                const setCode = item.products?.set_code ? ` [${item.products.set_code.toUpperCase()}]` : '';
                return `• ${qty}x ${name}${setCode}${finishLabel} - $${lineTotal}`;
            }).join('\n');
            const overflowNote = items.length > 40 ? `\n_(+${items.length - 40} ítems más — ver correo)_` : '';

            const waMessage = [
                `¡Hola Geeko-Asesor! Quiero concretar esta orden:`,
                `*Cliente:* ${form.full_name}`,
                `*WhatsApp:* ${form.whatsapp}`,
                `*Correo:* ${form.email}`,
                `*Total:* $${total.toFixed(2)}`,
                ``,
                `*Detalle (${items.length} ítem${items.length !== 1 ? 's' : ''}):*`,
                itemLines + overflowNote,
                ``,
                `*Orden ID:* ${orderIdForMsg}`,
            ].join('\n');

            window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`, '_blank');

            // Notification
            try {
                sendCheckoutEmailNotification({
                    order_id: orderIdForMsg,
                    user_email: form.email || 'guest@geekorium.com',
                    order_total: total,
                    items: cartItems.map(item => ({
                        quantity: item.quantity,
                        products: { 
                            name: item.products?.name, 
                            price: item.products?.price, 
                            finish: item.products?.finish,
                            set_code: item.products?.set_code
                        }
                    })),
                    current_user_id: user?.id || "guest"
                });
            } catch (e) {
                console.error('Notification error:', e);
            }

            navigate('/checkout/success', {
                state: {
                    orderId: orderIdForMsg,
                    total,
                    items: simplifiedItems,
                    customerInfo: {
                        full_name: form.full_name,
                        whatsapp: form.whatsapp,
                        email: form.email,
                    }
                }
            });

        } catch (error: any) {
            console.error('Order error:', error);
            setValidationError(error.message || 'Error al procesar la orden. Verifique su conexión.');
        } finally {
            setIsProcessing(false);
        }
    };

    const subtotal = Array.isArray(cartItems)
        ? cartItems.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0)
        : 0;

    if (loading) return (
        <div className="min-h-[100dvh] bg-[#1F182D] flex items-center justify-center text-white">
            <div className="w-10 h-10 border-4 border-t-[#00AEB4] border-white/10 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-[100dvh] bg-[#1F182D] text-white flex flex-col">
            {/* Header for Branding Consistency */}
            <header className="h-[70px] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 flex items-center px-4 sm:px-6">
                <div className="max-w-7xl w-full mx-auto flex items-center">
                    <Link to="/" className="flex items-center gap-4 group relative">
                        <div className="flex items-center justify-center group-hover:scale-105 transition-transform relative">
                            <img src="/branding/Logo.png" alt="Logo" className="w-32 sm:w-40 object-contain" />
                            <span className="absolute -top-1 -right-4 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-tighter shadow-lg rotate-12">BETA</span>
                        </div>
                    </Link>
                </div>
            </header>

            <div className="flex-1 pt-12 pb-12 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* LEFT COLUMN - FORM */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#00AEB4] text-[#00AEB4] bg-[#00AEB4]/10 text-xs font-black uppercase tracking-widest transition-all">
                            <Truck size={14} />
                            Finalizar Compra (WhatsApp)
                        </div>
                    </div>

                    <div className="bg-[#281F3E]/60 border border-white/5 rounded-2xl p-6 sm:p-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Tus Datos</h2>

                        {validationError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm mb-4">
                                <AlertCircle size={16} />
                                {validationError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="full_name" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Nombre Completo</label>
                                <input
                                    id="full_name"
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600"
                                    value={form.full_name}
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label htmlFor="whatsapp" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Número de WhatsApp</label>
                                <input
                                    id="whatsapp"
                                    placeholder="Ej: 04141234567"
                                    type="tel"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono"
                                    value={form.whatsapp}
                                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                                />
                                <p className="text-[10px] text-neutral-500 mt-1">Usaremos este número para coordinar el pago.</p>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Correo Electrónico</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                                <p className="text-[10px] text-neutral-500 mt-1">Necesario para enviarte el resumen y notificaciones.</p>
                            </div>

                            {/* Hidden legacy fields */}
                            <div className="hidden">
                                <input value={form.address} readOnly />
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <button
                                onClick={handlePlaceOrder}
                                disabled={isProcessing || !isFormValid()}
                                className={`w-full py-4 font-black uppercase rounded-xl transition-all flex items-center justify-center gap-3 text-sm tracking-widest shadow-lg ${
                                    isFormValid() 
                                    ? 'bg-[#25D366] text-black hover:bg-[#1fba58]' 
                                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                                }`}
                            >
                                {isProcessing ? (
                                    <><Loader2 className="animate-spin" size={16} /> Procesando...</>
                                ) : (
                                    <><MessageCircle size={16} fill="currentColor" /> Confirmar y Pagar por WhatsApp</>
                                )}
                            </button>

                            {isFormValid() && (
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full py-3 bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    📄 Descargar Resumen de Orden (PDF)
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - SUMMARY */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 bg-[#281F3E]/80 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-base font-black uppercase tracking-tight mb-4 border-b border-white/5 pb-4">Resumen de Orden</h3>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar mb-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-3 items-center">
                                    <div className="w-10 h-14 bg-black/50 rounded border border-white/10 overflow-hidden flex-shrink-0">
                                        <img src={item.products?.image_url} className="w-full h-full object-cover" alt={item.products?.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white line-clamp-2 leading-snug">{item.products?.name}</p>
                                        <div className="flex gap-2 items-center">
                                            <p className="text-[9px] text-neutral-500 uppercase font-bold">{item.products?.set_code}</p>
                                            {(item.products?.finish === 'foil' || item.products?.finish === 'etched') && (
                                                <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1 py-0.5 rounded font-black uppercase">FOIL</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-neutral-400">x{item.quantity}</span>
                                            <span className="text-[11px] font-mono text-[#00AEB4] font-bold">
                                                ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <div className="flex justify-between text-xs text-neutral-400">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-400">
                                <span>Envío</span>
                                <span className="text-geeko-cyan font-bold italic underline">A coordinar por WhatsApp</span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-tight">Total estimado</span>
                            <span className="text-2xl font-black font-mono text-white">${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};
