import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCart, createOrder, sendCheckoutEmailNotification } from '../utils/api';
import { ShieldCheck, Truck, CreditCard, CheckCircle, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

// 24 estados de Venezuela
const VENEZUELA_STATES = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
    'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
    'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
];

const CEDULA_PREFIXES = ['V', 'E'] as const;

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Customer form
    const [form, setForm] = useState({
        full_name: '',
        cedula_prefix: 'V' as 'V' | 'E',
        cedula_number: '',
        whatsapp: '',
        state: '',
        country: 'Venezuela',
        address: '',
        email: '',
        shipping_method: '' as '' | 'pickup' | 'delivery' | 'nacional',
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
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, [navigate]);

    const validateStep1 = () => {
        if (!form.full_name.trim() || form.full_name.trim().length < 3) return 'El nombre completo debe tener al menos 3 caracteres.';
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.full_name.trim())) return 'El nombre solo puede contener letras y espacios.';
        if (!form.cedula_number.trim() || !/^\d{6,9}$/.test(form.cedula_number)) return 'La cédula debe tener entre 6 y 9 dígitos.';

        const phoneDigits = form.whatsapp.replace(/\D/g, '');
        if (!phoneDigits) return 'El número de WhatsApp es requerido.';
        if (!/^0(414|424|412|416|426|2\d{2})\d{7}$/.test(phoneDigits)) return 'Número de WhatsApp inválido. Debe ser un número venezolano (ej: 04141234567).';

        if (!form.country) return 'Selecciona un país.';
        if (!form.state.trim()) return 'Ingresa o selecciona un estado/provincia.';
        if (!form.address.trim() || form.address.trim().length < 5) return 'La dirección de entrega es muy corta.';
        if (!form.shipping_method) return 'Selecciona un método de despacho.';

        if (form.email.trim() && !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email.trim())) return 'El formato del correo electrónico es inválido.';
        return null;
    };

    const handleContinue = () => {
        const err = validateStep1();
        if (err) {
            setValidationError(err);
            return;
        }
        setValidationError(null);
        setStep(2);
    };

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const total = Array.isArray(cartItems)
                ? cartItems.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0)
                : 0;

            const simplifiedItems = cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                name: item.products?.name,
                set: item.products?.set_code,
                price: item.products?.price || 0,
                image_url: item.products?.image_url,
                foil: item.products?.is_foil || item.products?.finish === 'foil' || false,
                finish: item.products?.finish || (item.products?.is_foil ? 'foil' : 'normal'),
            }));

            const cedula = `${form.cedula_prefix}-${form.cedula_number}`;

            const orderResponse = await createOrder({
                userId: user?.id || null,
                items: simplifiedItems,
                shippingAddress: {
                    full_name: form.full_name,
                    address_line1: form.address,
                    city: form.state,
                    state: form.state,
                    zip_code: cedula,
                    country: form.country === 'Venezuela' ? 'VE' : form.country,
                    email: form.email,
                    phone: form.whatsapp
                },
                totalAmount: total,
                guestInfo: !user ? { email: form.email, phone: form.whatsapp } : undefined,
            });

            console.log("Order response:", orderResponse);

            let orderIdForMsg = 'PENDIENTE';
            if (typeof orderResponse === 'string') {
                orderIdForMsg = orderResponse;
            } else if (orderResponse) {
                // Sometimes it's an array if RPC returns a table type
                const resObj = Array.isArray(orderResponse) ? orderResponse[0] : orderResponse;
                orderIdForMsg = resObj?.order_id || resObj?.id || 'PENDIENTE';
            }

            // Trigger email notifications asynchronously
            try {
                // Map frontend items format to expected notification format
                const mappedItems = simplifiedItems.map(item => ({
                    quantity: item.quantity,
                    products: {
                        name: item.name,
                        price: item.price,
                        image_url: item.image_url
                    }
                }));

                // Fire and forget, don't await blocking UI
                sendCheckoutEmailNotification({
                    order_id: orderIdForMsg,
                    user_email: form.email,
                    order_total: total,
                    items: mappedItems,
                    current_user_id: user?.id || "guest"
                }).catch(err => console.error("Email notification failed to send:", err));
            } catch (e) {
                console.error("Error formatting email notification payload:", e);
            }

            // Build structured WhatsApp message per PRD spec
            const WA_NUMBER = '584242507802';
            const items = Array.isArray(cartItems) ? cartItems : [];

            // Count by type only (no individual card data)
            const normalCount = items.reduce((acc, item) => {
                const isFoil = item.products?.finish === 'foil' || item.products?.is_foil;
                return acc + (isFoil ? 0 : (item.quantity || 1));
            }, 0);
            const foilCount = items.reduce((acc, item) => {
                const isFoil = item.products?.finish === 'foil' || item.products?.is_foil;
                return acc + (isFoil ? (item.quantity || 1) : 0);
            }, 0);

            const typeLines = [
                normalCount > 0 ? `- Normal: ${normalCount} unidad(es)` : '',
                foilCount > 0 ? `- Foil: ${foilCount} unidad(es)` : '',
            ].filter(Boolean).join('\n');

            const waMessage = [
                `¡Hola Geeko-Asesor! Quiero concretar esta orden:`,
                `*Cliente:* ${form.full_name}`,
                `*CI/RIF:* ${cedula}`,
                `*Total a Pagar:* $${total.toFixed(2)}`,
                ``,
                `*Tipos de cartas:*`,
                typeLines,
                ``,
                `*Orden ID:* ${orderIdForMsg}`,
            ].join('\n');

            const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage)}`;

            // Open WhatsApp — native app on mobile, WhatsApp Web on desktop
            window.open(whatsappUrl, '_blank');

            navigate('/checkout/success', { state: { orderId: orderIdForMsg } });
        } catch (error) {
            console.error(error);
            alert('Error al procesar la orden. Por favor verifica el inventario.');
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
        <div className="min-h-[100dvh] bg-[#1F182D] text-white pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                {/* LEFT COLUMN - STEPS */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Progress */}
                    <div className="flex items-center gap-3 mb-6">
                        {[
                            { id: 1, label: 'Datos', icon: Truck },
                            { id: 2, label: 'Pago', icon: CreditCard },
                        ].map((s) => (
                            <div key={s.id}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all ${step === s.id
                                    ? 'border-[#00AEB4] text-[#00AEB4] bg-[#00AEB4]/10'
                                    : step > s.id
                                        ? 'border-green-500 text-green-500 bg-green-500/10'
                                        : 'border-white/10 text-neutral-500'
                                    }`}>
                                {step > s.id ? <CheckCircle size={14} /> : <s.icon size={14} />}
                                {s.label}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Datos del Cliente */}
                    {step === 1 && (
                        <div className="bg-[#281F3E]/60 border border-white/5 rounded-2xl p-6 sm:p-8">
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Datos del Cliente</h2>

                            {validationError && (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm mb-4">
                                    <AlertCircle size={16} />
                                    {validationError}
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="full_name" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Nombre Completo</label>
                                    <input
                                        id="full_name"
                                        placeholder="Carlos Ej. Rodríguez"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600"
                                        value={form.full_name}
                                        onChange={(e) => setForm({ ...form, full_name: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                                        maxLength={50}
                                    />
                                </div>

                                {/* Cédula de Identidad */}
                                <div>
                                    <label htmlFor="cedula_number" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Cédula de Identidad</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={form.cedula_prefix}
                                            onChange={(e) => setForm({ ...form, cedula_prefix: e.target.value as 'V' | 'E' })}
                                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white font-black w-16"
                                        >
                                            {CEDULA_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <input
                                            id="cedula_number"
                                            placeholder="12345678"
                                            type="tel"
                                            maxLength={9}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono"
                                            value={form.cedula_number}
                                            onChange={(e) => setForm({ ...form, cedula_number: e.target.value.replace(/\D/g, '') })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-1">Ej: V-12345678 o E-87654321</p>
                                </div>

                                {/* WhatsApp */}
                                <div>
                                    <label htmlFor="whatsapp" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Número de WhatsApp</label>
                                    <input
                                        id="whatsapp"
                                        placeholder="04145551234"
                                        type="tel"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono"
                                        value={form.whatsapp}
                                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, '') })}
                                        maxLength={11}
                                    />
                                </div>

                                {/* País */}
                                <div>
                                    <label htmlFor="country" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">País</label>
                                    <select
                                        id="country"
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value, state: '' })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white"
                                    >
                                        <option value="Venezuela">Venezuela</option>
                                        <option value="Estados Unidos">Estados Unidos</option>
                                        <option value="Colombia">Colombia</option>
                                        <option value="Otro">Otro/Multinacional</option>
                                    </select>
                                </div>

                                {/* Estado / Provincia */}
                                <div>
                                    <label htmlFor="state" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Estado / Provincia</label>
                                    {form.country === 'Venezuela' ? (
                                        <select
                                            id="state"
                                            value={form.state}
                                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white"
                                        >
                                            <option value="" disabled>Selecciona tu estado...</option>
                                            {VENEZUELA_STATES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            id="state"
                                            placeholder="Ingresa tu estado/provincia"
                                            value={form.state}
                                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600"
                                        />
                                    )}
                                </div>

                                {/* Dirección */}
                                <div>
                                    <label htmlFor="address" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Dirección de Entrega</label>
                                    <input
                                        id="address"
                                        placeholder="Av. Principal, Edificio X, Piso 2"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        maxLength={150}
                                    />
                                </div>

                                {/* Email (optional) */}
                                <div>
                                    <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">
                                        Email <span className="text-neutral-600 normal-case font-normal">(opcional, para confirmación)</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#00AEB4] outline-none transition-colors text-white placeholder:text-neutral-600"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>

                                {/* Método de Despacho */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                                        Método de Despacho <span className="text-red-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: 'pickup', label: 'Pick Up', desc: 'Retiro en tienda', icon: '🏪' },
                                            { value: 'delivery', label: 'Delivery', desc: 'Entrega a domicilio', icon: '🏍️' },
                                            { value: 'nacional', label: 'Envío Nacional', desc: 'Encomienda / MRW', icon: '📦' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, shipping_method: opt.value as typeof form.shipping_method })}
                                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${form.shipping_method === opt.value
                                                    ? 'border-[#00AEB4]/60 bg-[#00AEB4]/10 text-white'
                                                    : 'border-white/10 bg-black/30 text-neutral-500 hover:border-white/20 hover:text-neutral-300'
                                                    }`}
                                            >
                                                <span className="text-lg">{opt.icon}</span>
                                                <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                                                <span className="text-[9px] text-neutral-500 leading-tight">{opt.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={handleContinue}
                                    className="px-8 py-4 bg-[#00AEB4] text-black font-black uppercase rounded-xl hover:bg-[#00c5cc] transition-all shadow-[0_0_20px_rgba(0,174,180,0.3)] text-sm tracking-widest"
                                >
                                    Continuar al Pago →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Confirmación y WhatsApp */}
                    {step === 2 && (
                        <div className="bg-[#281F3E]/60 border border-white/5 rounded-2xl p-6 sm:p-8">
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Confirmar Orden</h2>

                            {/* Info Banner */}
                            <div className="p-4 border border-[#00AEB4]/20 bg-[#00AEB4]/5 rounded-xl mb-6 flex items-start gap-4">
                                <ShieldCheck className="text-[#00AEB4] shrink-0 mt-0.5" size={24} />
                                <div>
                                    <p className="font-bold text-white text-sm mb-0.5">Orden Asistida por Geeko-Asesor</p>
                                    <p className="text-xs text-neutral-400">Al confirmar, serás redirigido a WhatsApp donde un asesor verificará el stock físico y coordinará el pago y despacho contigo.</p>
                                </div>
                            </div>

                            {/* Datos del Cliente — resumen */}
                            <div className="p-4 bg-black/30 border border-white/10 rounded-xl mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Datos del Cliente</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1">Nombre</span>
                                        <span className="text-white font-bold">{form.full_name}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1">CI/RIF</span>
                                        <span className="font-mono text-white font-bold">{form.cedula_prefix}-{form.cedula_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1">WhatsApp</span>
                                        <span className="font-mono text-white">{form.whatsapp}</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500 block text-[10px] uppercase tracking-wider mb-1">Despacho</span>
                                        <span className="text-white capitalize">{form.shipping_method}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instrucción WA */}
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-xs text-neutral-400">
                                    Al presionar el botón se generará tu orden y te redirigiremos a WhatsApp con el detalle completo pre-cargado.
                                    <span className="text-amber-400 font-bold"> No realices ningún pago hasta que el asesor confirme el stock disponible.</span>
                                </p>
                            </div>

                            <div className="mt-8 flex justify-between items-center">
                                <button onClick={() => setStep(1)} className="text-neutral-500 hover:text-white font-bold text-sm transition-colors">
                                    ← Atrás
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                    data-testid="place-order-button"
                                    className="px-8 py-4 bg-[#25D366] text-black font-black uppercase rounded-xl hover:bg-[#1fba58] shadow-[0_0_20px_rgba(37,211,102,0.35)] transition-all flex items-center gap-3 text-sm tracking-widest disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="animate-spin" size={16} /> Procesando...</>
                                    ) : (
                                        <><MessageCircle size={16} fill="currentColor" /> Confirmar y Pagar por WhatsApp</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - ORDER SUMMARY */}
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
                                        <p className="text-[9px] text-neutral-500 uppercase font-bold">{item.products?.set_code}</p>
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
                                <span className="text-[#00AEB4] font-bold">A coordinar</span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-tight">Total</span>
                            <span className="text-2xl font-black font-mono">${subtotal.toFixed(2)}</span>
                        </div>

                        {/* Customer summary in step 2 */}
                        {step === 2 && form.full_name && (
                            <div className="mt-4 p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Datos del Cliente</p>
                                <p className="text-xs text-white font-bold">{form.full_name}</p>
                                <p className="text-[10px] text-neutral-400">{form.cedula_prefix}-{form.cedula_number}</p>
                                <p className="text-[10px] text-neutral-400">{form.state} · {form.whatsapp}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
