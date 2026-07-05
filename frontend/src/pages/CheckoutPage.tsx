import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchCart, createOrder, sendCheckoutEmailNotification, fetchUserAddresses, saveUserAddress } from '../utils/api';
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
        shipping_method: 'pickup' as 'pickup' | 'delivery',
    });

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
    const [saveToBook, setSaveToBook] = useState(false);
    
    // Billing Form
    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [billingForm, setBillingForm] = useState({
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: 'Caracas',
        state: 'Distrito Capital',
        cedula: '',
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

    const loadAddresses = async () => {
        try {
            const addrs = await fetchUserAddresses();
            setSavedAddresses(addrs);
            const defaultAddr = addrs.find((a: any) => a.is_default);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
                setForm(prev => ({
                    ...prev,
                    address: defaultAddr.address_line1 + (defaultAddr.address_line2 ? `, ${defaultAddr.address_line2}` : ''),
                    state: defaultAddr.state,
                }));
            }
            
            const defaultBilling = addrs.find((a: any) => a.is_billing);
            if (defaultBilling) {
                setBillingForm({
                    full_name: defaultBilling.full_name,
                    phone: defaultBilling.phone,
                    address_line1: defaultBilling.address_line1,
                    address_line2: defaultBilling.address_line2 || '',
                    city: defaultBilling.city,
                    state: defaultBilling.state,
                    cedula: defaultBilling.zip_code || '',
                });
            }
        } catch (err) {
            console.error("Error loading addresses for checkout", err);
        }
    };

    const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        cedula_prefix: 'V',
        cedula_number: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const cedulaStr = profile.cedula || '';
                    const parsedPrefix = cedulaStr.startsWith('E-') ? 'E' : 'V';
                    const parsedNumber = cedulaStr.replace(/^[VE]-/, '').replace(/\D/g, '');

                    setProfileForm({
                        first_name: profile.first_name || '',
                        last_name: profile.last_name || '',
                        cedula_prefix: parsedPrefix,
                        cedula_number: parsedNumber,
                        phone: profile.phone || '',
                        address: profile.address || ''
                    });

                    setForm(prev => ({
                        ...prev,
                        full_name: profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : prev.full_name,
                        whatsapp: profile.phone || prev.whatsapp,
                        email: user.email || prev.email,
                        address: profile.address || prev.address,
                        cedula_number: parsedNumber || prev.cedula_number,
                        cedula_prefix: parsedPrefix as 'V' | 'E',
                    }));

                    if (!profile.first_name || !profile.last_name || !profile.phone || !profile.cedula) {
                        setShowCompleteProfileModal(true);
                    }
                } else {
                    setForm(prev => ({ ...prev, email: user.email || prev.email }));
                    setShowCompleteProfileModal(true);
                }
                loadAddresses();
            }
        };
        loadProfile();
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileSaveError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay un usuario activo.");

            const fullCedula = `${profileForm.cedula_prefix}-${profileForm.cedula_number}`;

            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: profileForm.first_name.trim(),
                    last_name: profileForm.last_name.trim(),
                    cedula: fullCedula,
                    phone: profileForm.phone.trim(),
                    address: profileForm.address.trim()
                })
                .eq('id', user.id);

            if (error) throw error;

            setForm(prev => ({
                ...prev,
                full_name: `${profileForm.first_name.trim()} ${profileForm.last_name.trim()}`,
                whatsapp: profileForm.phone.trim(),
                address: profileForm.address.trim(),
                cedula_number: profileForm.cedula_number,
                cedula_prefix: profileForm.cedula_prefix as 'V' | 'E'
            }));

            setShowCompleteProfileModal(false);
        } catch (err: any) {
            console.error("Error saving profile details:", err);
            setProfileSaveError(err.message || "Error al guardar los datos de perfil.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAddressChange = (addrId: string) => {
        setSelectedAddressId(addrId);
        if (addrId === 'new') {
            setForm(prev => ({
                ...prev,
                address: '',
                state: 'Distrito Capital',
            }));
        } else {
            const addr = savedAddresses.find(a => a.id === addrId);
            if (addr) {
                setForm(prev => ({
                    ...prev,
                    address: addr.address_line1 + (addr.address_line2 ? `, ${addr.address_line2}` : ''),
                    state: addr.state,
                }));
            }
        }
    };

    const isFormValid = () => {
        const nameValid = form.full_name.trim().length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(form.full_name.trim());
        const phoneDigits = form.whatsapp.replace(/\D/g, '');
        const phoneValid = /^(0|58)?(414|424|412|416|426|2\d{2})\d{7}$/.test(phoneDigits);
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
        
        // Validate shipping address if delivery
        const addressValid = form.shipping_method === 'pickup' || (form.address.trim().length > 5 && form.address !== 'Tienda Geekorium (Pick Up)');
        
        // Validate billing address if different
        const billingValid = sameAsShipping || (
            billingForm.full_name.trim().length >= 3 &&
            billingForm.phone.replace(/\D/g, '').length >= 7 &&
            billingForm.address_line1.trim().length > 5
        );

        return nameValid && phoneValid && emailValid && addressValid && billingValid;
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

            const simplifiedItems = cartItems.map(item => {
                const isAcc = !!item.accessory_id;
                const stock = item.products?.stock || 0;
                const isOnDemand = !isAcc && (item.quantity > stock);
                
                return {
                    product_id: isAcc ? null : item.product_id,
                    accessory_id: isAcc ? item.accessory_id : null,
                    printing_id: item.printing_id,
                    quantity: item.quantity,
                    name: item.products?.name || item.name,
                    set: item.products?.set_code,
                    price: item.products?.price || 0,
                    foil: item.products?.is_foil || item.products?.finish === 'foil' || false,
                    finish: item.products?.finish || (item.products?.is_foil ? 'foil' : 'nonfoil'),
                    is_on_demand: isOnDemand
                };
            });

            const cedula = `${form.cedula_prefix}-${form.cedula_number || '00000000'}`;

            const shippingAddressObj = {
                full_name: form.full_name,
                address_line1: form.address,
                city: 'Caracas',
                state: form.state,
                zip_code: cedula,
                country: 'VE',
                email: form.email || 'guest@geekorium.com',
                phone: form.whatsapp,
                shipping_method: form.shipping_method,
                billing_address: sameAsShipping ? null : {
                    full_name: billingForm.full_name,
                    address_line1: billingForm.address_line1,
                    address_line2: billingForm.address_line2,
                    city: billingForm.city,
                    state: billingForm.state,
                    zip_code: billingForm.cedula,
                    phone: billingForm.phone,
                    country: 'VE'
                }
            };

            const orderResponse = await createOrder({
                userId: user?.id || null,
                items: simplifiedItems,
                shippingAddress: shippingAddressObj,
                totalAmount: total,
                guestInfo: !user ? { email: form.email || 'guest@geekorium.com', phone: form.whatsapp } : undefined,
                cartId: cartId || undefined
            });

            // Save address if requested and logged in
            if (form.shipping_method === 'delivery' && selectedAddressId === 'new' && saveToBook && user) {
                try {
                    await saveUserAddress({
                        name: 'Dirección de Checkout',
                        full_name: form.full_name,
                        phone: form.whatsapp,
                        address_line1: form.address,
                        city: 'Caracas',
                        state: form.state,
                        zip_code: form.cedula_number,
                        country: 'Venezuela',
                        is_default: savedAddresses.length === 0,
                        is_billing: sameAsShipping && savedAddresses.length === 0
                    });
                } catch (e) {
                    console.error("Failed to auto-save address", e);
                }
            }

            // Save billing address if requested and different
            if (!sameAsShipping && saveToBook && user) {
                try {
                    await saveUserAddress({
                        name: 'Facturación Checkout',
                        full_name: billingForm.full_name,
                        phone: billingForm.phone,
                        address_line1: billingForm.address_line1,
                        address_line2: billingForm.address_line2,
                        city: billingForm.city,
                        state: billingForm.state,
                        zip_code: billingForm.cedula,
                        country: 'Venezuela',
                        is_default: false,
                        is_billing: true
                    });
                } catch (e) {
                    console.error("Failed to auto-save billing address", e);
                }
            }

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
                const name = item.products?.name || 'Item';
                const qty = item.quantity || 1;
                const unitPrice = (item.products?.price || 0);
                const lineTotal = (unitPrice * qty).toFixed(2);
                const finish = item.products?.finish || (item.products?.is_foil ? 'foil' : 'nonfoil');
                const finishLabel = (finish === 'foil' || finish === 'etched') ? ' [FOIL]' : '';
                const setCode = item.products?.set_code ? ` [${item.products.set_code?.toUpperCase()}]` : '';
                
                const stock = item.products?.stock || 0;
                const isOnDemand = !item.accessory_id && (item.quantity > stock);
                const onDemandLabel = isOnDemand ? ' *(POR ENCARGO)*' : '';
                
                return `• ${qty}x ${name}${setCode}${finishLabel}${onDemandLabel} - $${lineTotal}`;
            }).join('\n');
            const overflowNote = items.length > 40 ? `\n_(+${items.length - 40} ítems más — ver correo)_` : '';

            const hasOnDemand = items.some(item => !item.accessory_id && (item.quantity > (item.products?.stock || 0)));

            const waMessage = [
                hasOnDemand ? `*--- ORDEN POR ENCARGO ---*` : '',
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
            ].filter(line => line !== '').join('\n');

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
                            is_on_demand: !item.accessory_id && (item.quantity > (item.products?.stock || 0)) 
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
            <div className="w-10 h-10 border-4 border-t-[#0066FF] border-white/10 rounded-full animate-spin" />
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
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#0066FF] text-[#0066FF] bg-[#0066FF]/10 text-xs font-black uppercase tracking-widest transition-all">
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
                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Método de Entrega</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        className={`p-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                                            form.shipping_method === 'pickup'
                                                ? 'bg-[#0066FF]/10 border-[#0066FF] text-[#0066FF]'
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                        onClick={() => setForm({ ...form, shipping_method: 'pickup', address: 'Tienda Geekorium (Pick Up)' })}
                                    >
                                        <span>🏪 Retiro en Tienda</span>
                                        <span className="text-[9px] lowercase font-normal opacity-70">Gratis (Pick Up)</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`p-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                                            form.shipping_method === 'delivery'
                                                ? 'bg-[#0066FF]/10 border-[#0066FF] text-[#0066FF]'
                                                : 'bg-black/40 border-white/10 text-slate-400 hover:border-white/20'
                                        }`}
                                        onClick={() => setForm({ ...form, shipping_method: 'delivery', address: '' })}
                                    >
                                        <span>🚀 Envío a Domicilio</span>
                                        <span className="text-[9px] lowercase font-normal opacity-70">A coordinar por WhatsApp</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="full_name" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Nombre Completo</label>
                                <input
                                    id="full_name"
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600"
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
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono"
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
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label htmlFor="cedula_prefix" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Nac.</label>
                                    <select
                                        id="cedula_prefix"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white"
                                        value={form.cedula_prefix}
                                        onChange={(e) => setForm({ ...form, cedula_prefix: e.target.value as 'V' | 'E' })}
                                    >
                                        <option value="V">V</option>
                                        <option value="E">E</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label htmlFor="cedula_number" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Cédula</label>
                                    <input
                                        id="cedula_number"
                                        placeholder="Ej: 12345678"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono"
                                        value={form.cedula_number}
                                        onChange={(e) => setForm({ ...form, cedula_number: e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                            </div>

                            {form.shipping_method === 'delivery' && (
                                <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in duration-200">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-white">Dirección de Envío</h3>
                                    
                                    {savedAddresses.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Usar Dirección Guardada</label>
                                            <select
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white"
                                                value={selectedAddressId}
                                                onChange={(e) => handleAddressChange(e.target.value)}
                                            >
                                                <option value="new">Nueva Dirección...</option>
                                                {savedAddresses.map(a => (
                                                    <option key={a.id} value={a.id}>{a.name} - {a.address_line1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {selectedAddressId === 'new' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="address" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Calle y Dirección Completa</label>
                                                <textarea
                                                    id="address"
                                                    rows={3}
                                                    placeholder="Ej: Av. Principal de Las Mercedes, Edif. Geeko, Apto 5"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 resize-none text-sm"
                                                    value={form.address}
                                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="state" className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Estado / Región</label>
                                                <input
                                                    id="state"
                                                    placeholder="Ej: Distrito Capital"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600"
                                                    value={form.state}
                                                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                                                />
                                            </div>

                                            {savedAddresses.length >= 0 && (
                                                <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-white/10 bg-black/40 text-[#0066FF] focus:ring-0 focus:ring-offset-0"
                                                        checked={saveToBook}
                                                        onChange={(e) => setSaveToBook(e.target.checked)}
                                                    />
                                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Guardar en mi libreta de direcciones</span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Billing Address Section */}
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-white">Dirección de Facturación</h3>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="rounded border-white/10 bg-black/40 text-[#0066FF] focus:ring-0 focus:ring-offset-0"
                                            checked={sameAsShipping}
                                            onChange={(e) => setSameAsShipping(e.target.checked)}
                                        />
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Igual al envío</span>
                                    </label>
                                </div>

                                {!sameAsShipping && (
                                    <div className="space-y-4 animate-in fade-in duration-200">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Nombre / Razón Social</label>
                                            <input
                                                placeholder="Nombre completo o razón social"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 text-sm"
                                                value={billingForm.full_name}
                                                onChange={(e) => setBillingForm({ ...billingForm, full_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">WhatsApp / Contacto</label>
                                                <input
                                                    placeholder="Ej: 04141234567"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono text-sm"
                                                    value={billingForm.phone}
                                                    onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value.replace(/\D/g, '') })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Cédula / RIF</label>
                                                <input
                                                    placeholder="Ej: V-12345678"
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 font-mono text-sm"
                                                    value={billingForm.cedula}
                                                    onChange={(e) => setBillingForm({ ...billingForm, cedula: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-1.5">Dirección de Facturación</label>
                                            <textarea
                                                rows={2}
                                                placeholder="Dirección fiscal o residencial"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-[#0066FF] outline-none transition-colors text-white placeholder:text-neutral-600 resize-none text-sm"
                                                value={billingForm.address_line1}
                                                onChange={(e) => setBillingForm({ ...billingForm, address_line1: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
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
                            {cartItems.map((item) => {
                                const isAcc = !!item.accessory_id;
                                const stock = item.products?.stock || 0;
                                const isOnDemand = !isAcc && (item.quantity > stock);

                                return (
                                    <div key={item.id} className="flex gap-3 items-center">
                                        <div className="w-10 h-14 bg-black/50 rounded border border-white/10 overflow-hidden flex-shrink-0 relative">
                                            <img src={item.products?.image_url} className="w-full h-full object-cover" alt={item.products?.name} />
                                            {isOnDemand && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <span className="text-[6px] font-black bg-white text-black px-0.5 rounded-sm rotate-12">POR ENCARGO</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-white line-clamp-1 leading-snug">{item.products?.name}</p>
                                                {isOnDemand && (
                                                    <span className="text-[7px] font-black text-white border border-white/30 px-1 rounded flex-shrink-0">POR ENCARGO</span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-neutral-500 uppercase font-bold">{item.products?.set_code}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] text-neutral-400">x{item.quantity}</span>
                                                <span className="text-[11px] font-mono text-[#0066FF] font-bold">
                                                    ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <div className="flex justify-between text-xs text-neutral-400">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-neutral-400">
                                <span>Envío</span>
                                <span className="text-white font-bold italic underline">A coordinar por WhatsApp</span>
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
            {showCompleteProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-geeko-gold/20 to-orange-600/20 rounded-2xl border border-geeko-gold/30">
                                <AlertCircle className="text-geeko-gold" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black italic text-white tracking-tighter uppercase">Completa tus Datos</h3>
                                <p className="text-xs text-slate-400">Requerimos completar tu perfil antes de continuar con la compra.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] text-geeko-gold font-black uppercase tracking-widest mb-1.5">Nombre</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.first_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all"
                                        placeholder="Erika"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-geeko-gold font-black uppercase tracking-widest mb-1.5">Apellido</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.last_name}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all"
                                        placeholder="García"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-geeko-gold font-black uppercase tracking-widest mb-1.5">Cédula</label>
                                <div className="flex gap-2">
                                    <select
                                        value={profileForm.cedula_prefix}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, cedula_prefix: e.target.value }))}
                                        className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-geeko-gold"
                                    >
                                        <option value="V">V</option>
                                        <option value="E">E</option>
                                    </select>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.cedula_number}
                                        onChange={(e) => setProfileForm(prev => ({ ...prev, cedula_number: e.target.value.replace(/\D/g, '') }))}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all"
                                        placeholder="12345678"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-geeko-gold font-black uppercase tracking-widest mb-1.5">Teléfono / WhatsApp</label>
                                <input
                                    type="tel"
                                    required
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all"
                                    placeholder="04141234567"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] text-geeko-gold font-black uppercase tracking-widest mb-1.5">Dirección de Envío</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={profileForm.address}
                                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all resize-none"
                                    placeholder="Calle, edif, nro, apto, zona..."
                                />
                            </div>

                            {profileSaveError && (
                                <p className="text-xs text-rose-500 font-semibold">{profileSaveError}</p>
                            )}

                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="w-full mt-2 py-3 bg-geeko-gold hover:bg-yellow-500 disabled:bg-slate-700 text-black font-black uppercase tracking-widest rounded-xl transition-all text-xs flex items-center justify-center gap-2"
                            >
                                {savingProfile ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} /> Guardando...
                                    </>
                                ) : (
                                    'Guardar y Continuar'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
