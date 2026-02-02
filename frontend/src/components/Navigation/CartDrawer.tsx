import React, { useEffect, useState } from 'react';
import { ShoppingCart, X, CreditCard, Loader2 } from 'lucide-react';
import { fetchCart, checkoutCart } from '../../utils/api';

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    products: {
        id: string;
        name: string;
        price: number;
        image_url: string;
        set_code: string;
    }
}

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadCart();
        }
    }, [isOpen]);

    const loadCart = async () => {
        setLoading(true);
        try {
            const data = await fetchCart();
            setItems(data.items || []);
        } catch (err) {
            console.error("Failed to load cart", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            await checkoutCart();
            setItems([]);
            alert("¡Compra completada con éxito!");
            onClose();
        } catch (err) {
            console.error("Checkout failed", err);
            alert("Error al procesar la compra.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const subtotal = items.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="w-screen max-w-md flex flex-col bg-[#0a0a0a] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">

                    {/* Header */}
                    <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between bg-neutral-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-geeko-cyan/10 rounded-lg">
                                <ShoppingCart size={20} className="text-geeko-cyan" />
                            </div>
                            <h2 className="text-lg font-black tracking-tight uppercase">Tu Carrito</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <Loader2 size={32} className="text-geeko-cyan animate-spin" />
                                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Cargando Carrito...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-50">
                                <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center">
                                    <ShoppingCart size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">Tu carrito está vacío</p>
                                    <p className="text-xs text-neutral-500">Agrega algunos productos del Marketplace.</p>
                                </div>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="w-20 h-28 bg-neutral-900 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                                        <img src={item.products?.image_url} alt={item.products?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <h4 className="text-sm font-bold text-white leading-tight mb-1">{item.products?.name}</h4>
                                            <p className="text-[10px] font-black uppercase text-neutral-500">{item.products?.set_code}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-mono font-black text-geeko-cyan">${(item.products?.price || 0).toFixed(2)}</span>
                                            <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                                                <span className="text-xs font-bold">x{item.quantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Summary */}
                    {items.length > 0 && (
                        <div className="p-8 bg-[#080808] border-t border-white/10 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest">
                                    <span>Envío</span>
                                    <span className="text-geeko-green">Gratis</span>
                                </div>
                                <div className="h-px bg-white/5 my-4" />
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-black uppercase tracking-widest">Total</span>
                                    <span className="text-3xl font-black text-white font-mono leading-none">${subtotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                className="w-full h-14 bg-geeko-cyan hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:shadow-[0_0_50px_rgba(0,229,255,0.4)] transition-all transform active:scale-[0.98] disabled:opacity-50"
                            >
                                {isCheckingOut ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                {isCheckingOut ? 'Procesando...' : 'Finalizar Compra'}
                            </button>

                            <p className="text-[10px] text-center text-neutral-600 font-medium">
                                Pago seguro procesado por Geekorium Engine.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
