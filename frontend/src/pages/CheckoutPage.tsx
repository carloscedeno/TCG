import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCart, createOrder, fetchUserAddresses, saveUserAddress } from '../utils/api';
import { ShieldCheck, Truck, CreditCard, CheckCircle, MapPin, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [isNewAddress, setIsNewAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        full_name: '',
        address_line1: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA'
    });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const cartData = await fetchCart();
            if (!cartData.items || cartData.items.length === 0) {
                navigate('/');
                return;
            }
            setCartItems(cartData.items);

            const userAddresses = await fetchUserAddresses();
            setAddresses(userAddresses);
            if (userAddresses.length > 0) {
                setSelectedAddress(userAddresses.find((a: any) => a.is_default) || userAddresses[0]);
            } else {
                setIsNewAddress(true);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async () => {
        try {
            const saved = await saveUserAddress({ ...newAddress, is_default: addresses.length === 0 });
            setAddresses([...addresses, saved[0]]);
            setSelectedAddress(saved[0]);
            setIsNewAddress(false);
        } catch (err) {
            alert('Error saving address');
        }
    };

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User required");

            const total = cartItems.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0);

            const simplifiedItems = cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.products?.price || 0
            }));

            await createOrder({
                userId: user.id,
                items: simplifiedItems,
                shippingAddress: selectedAddress,
                totalAmount: total
            });

            // Navigate to success
            navigate('/checkout/success');
        } catch (error) {
            console.error(error);
            alert('Error placing order. Please check stock availability.');
        } finally {
            setIsProcessing(false);
        }
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0);

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#080808] text-white pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* LEFT COLUMN - STEPS */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Progress */}
                    <div className="flex items-center gap-4 mb-8">
                        {[
                            { id: 1, label: 'Shipping', icon: Truck },
                            { id: 2, label: 'Payment', icon: CreditCard },
                            { id: 3, label: 'Confirm', icon: ShieldCheck }
                        ].map((s) => (
                            <div key={s.id}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${step === s.id ? 'border-geeko-cyan text-geeko-cyan bg-geeko-cyan/10' : 'border-neutral-800 text-neutral-500'}`}>
                                <s.icon size={16} />
                                <span className="text-sm font-bold uppercase tracking-wider">{s.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Content Step 1: Shipping */}
                    {step === 1 && (
                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 animate-in fade-in transition-all">
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Detalles de Envío</h2>

                            {!isNewAddress && addresses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            onClick={() => setSelectedAddress(addr)}
                                            className={`cursor-pointer p-6 rounded-xl border transition-all ${selectedAddress?.id === addr.id ? 'border-geeko-cyan bg-geeko-cyan/5' : 'border-white/10 hover:border-white/20'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <MapPin size={20} className={selectedAddress?.id === addr.id ? 'text-geeko-cyan' : 'text-neutral-500'} />
                                                {selectedAddress?.id === addr.id && <CheckCircle size={20} className="text-geeko-cyan" />}
                                            </div>
                                            <p className="font-bold text-white">{addr.full_name}</p>
                                            <p className="text-sm text-neutral-400">{addr.address_line1}</p>
                                            <p className="text-sm text-neutral-400">{addr.city}, {addr.state} {addr.zip_code}</p>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setIsNewAddress(true)}
                                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-dashed border-white/20 hover:border-geeko-cyan/50 hover:bg-white/5 transition-all group"
                                    >
                                        <Plus size={24} className="text-neutral-500 group-hover:text-geeko-cyan" />
                                        <span className="text-sm font-bold text-neutral-400 group-hover:text-white">Agregar Nueva Dirección</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 max-w-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Full Name" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-geeko-cyan outline-none transition-colors"
                                            value={newAddress.full_name} onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })} />
                                    </div>
                                    <input placeholder="Address Line 1" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-geeko-cyan outline-none transition-colors"
                                        value={newAddress.address_line1} onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="City" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-geeko-cyan outline-none transition-colors"
                                            value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                                        <input placeholder="State" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-geeko-cyan outline-none transition-colors"
                                            value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="ZIP Code" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 focus:border-geeko-cyan outline-none transition-colors"
                                            value={newAddress.zip_code} onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })} />
                                        <input placeholder="Country" disabled value="USA" className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-3 text-neutral-500 cursor-not-allowed" />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        {addresses.length > 0 && <button onClick={() => setIsNewAddress(false)} className="px-6 py-2 rounded-lg text-sm font-bold text-neutral-400 hover:text-white">Cancelar</button>}
                                        <button onClick={handleSaveAddress} className="px-6 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200">Guardar Dirección</button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => selectedAddress && setStep(2)}
                                    disabled={!selectedAddress}
                                    className="px-8 py-4 bg-geeko-cyan text-black font-black uppercase rounded-xl hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Continuar al Pago
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Payment */}
                    {step === 2 && (
                        <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-8 animate-in fade-in transition-all">
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Método de Pago</h2>

                            <div className="p-6 border border-geeko-cyan/20 bg-geeko-cyan/5 rounded-xl mb-6">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="text-geeko-cyan" size={32} />
                                    <div>
                                        <p className="font-bold text-white mb-1">Pagos Seguros (Simulado)</p>
                                        <p className="text-xs text-neutral-400">Este es un entorno de demostración. No se realizará ningún cargo real.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-8">
                                <button className="flex-1 py-4 border border-geeko-cyan bg-geeko-cyan/10 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                    <CreditCard size={20} /> Tarjeta de Crédito
                                </button>
                                <button className="flex-1 py-4 border border-white/10 bg-black/20 text-neutral-500 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                    PayPal (Pronto)
                                </button>
                            </div>

                            {/* Fake Form */}
                            <div className="space-y-4 max-w-md opacity-75">
                                <input placeholder="Card Number" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3" disabled value="4242 4242 4242 4242" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="MM/YY" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3" disabled value="12/28" />
                                    <input placeholder="CVC" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3" disabled value="123" />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button onClick={() => setStep(1)} className="text-neutral-500 hover:text-white font-bold">Atrás</button>
                                <button
                                    onClick={() => handlePlaceOrder()}
                                    disabled={isProcessing}
                                    className="px-8 py-4 bg-geeko-cyan text-black font-black uppercase rounded-xl hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : 'Confirmar y Pagar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - SUMMARY */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-4 border-b border-white/5 pb-4">Resumen de Orden</h3>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar mb-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-3">
                                    <div className="w-12 h-16 bg-black rounded border border-white/10 overflow-hidden flex-shrink-0">
                                        <img src={item.products?.image_url} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white line-clamp-1">{item.products?.name}</p>
                                        <p className="text-[10px] text-neutral-500 uppercase">{item.products?.set_code}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs text-neutral-400">x{item.quantity}</span>
                                            <span className="text-xs font-mono text-geeko-cyan">${(item.products?.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <div className="flex justify-between text-sm text-neutral-400">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-neutral-400">
                                <span>Shipping</span>
                                <span className="text-geeko-green">FREE</span>
                            </div>
                            <div className="flex justify-between text-sm text-neutral-400">
                                <span>Tax (Est.)</span>
                                <span>$0.00</span>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-end">
                            <span className="text-sm font-black uppercase">Total</span>
                            <span className="text-2xl font-black font-mono text-white">${subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
