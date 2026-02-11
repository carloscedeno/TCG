import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, CreditCard, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import { fetchCart, updateCartItemQuantity, removeFromCart } from '../../utils/api';

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
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        const handleCartUpdate = () => {
            loadCart();
        };

        window.addEventListener('cart-updated', handleCartUpdate);

        if (isOpen) {
            loadCart();
        }

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
        };
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

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(cartItemId);
            return;
        }

        setUpdating(cartItemId);
        try {
            await updateCartItemQuantity(cartItemId, newQuantity);
            await loadCart(); // Refresh cart
        } catch (err) {
            console.error('Failed to update quantity', err);
            alert('Error al actualizar cantidad');
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveItem = async (cartItemId: string) => {
        setUpdating(cartItemId);
        try {
            await removeFromCart(cartItemId);
            await loadCart(); // Refresh cart
        } catch (err) {
            console.error('Failed to remove item', err);
            alert('Error al eliminar item');
        } finally {
            setUpdating(null);
        }
    };

    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    const subtotal = items.reduce((acc, item) => acc + (item.products?.price || 0) * item.quantity, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div
                data-testid="cart-drawer"
                className="absolute inset-y-0 right-0 max-w-full flex"
            >
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
                                <div key={item.id} data-testid="cart-item" className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
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

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    data-testid="decrease-quantity-button"
                                                    className="w-7 h-7 bg-black/40 hover:bg-red-500/20 border border-white/5 
                                                               hover:border-red-500/50 rounded-lg flex items-center justify-center 
                                                               transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={item.quantity <= 1 || updating === item.id}
                                                >
                                                    {updating === item.id ? (
                                                        <Loader2 size={14} className="text-neutral-400 animate-spin" />
                                                    ) : (
                                                        <Minus size={14} className="text-neutral-400 group-hover/btn:text-red-500" />
                                                    )}
                                                </button>

                                                <span className="text-xs font-bold min-w-[2rem] text-center">
                                                    x{item.quantity}
                                                </span>

                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    data-testid="increase-quantity-button"
                                                    className="w-7 h-7 bg-black/40 hover:bg-geeko-cyan/20 border border-white/5 
                                                               hover:border-geeko-cyan/50 rounded-lg flex items-center justify-center 
                                                               transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={updating === item.id}
                                                >
                                                    {updating === item.id ? (
                                                        <Loader2 size={14} className="text-neutral-400 animate-spin" />
                                                    ) : (
                                                        <Plus size={14} className="text-neutral-400 group-hover/btn:text-geeko-cyan" />
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    data-testid="remove-item-button"
                                                    className="w-7 h-7 bg-black/40 hover:bg-red-500/20 border border-white/5 
                                                               hover:border-red-500/50 rounded-lg flex items-center justify-center 
                                                               transition-all group/btn ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={updating === item.id}
                                                >
                                                    {updating === item.id ? (
                                                        <Loader2 size={14} className="text-neutral-400 animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} className="text-neutral-400 group-hover/btn:text-red-500" />
                                                    )}
                                                </button>
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
                                data-testid="checkout-button"
                                className="w-full h-14 bg-geeko-cyan hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:shadow-[0_0_50px_rgba(0,229,255,0.4)] transition-all transform active:scale-[0.98]"
                            >
                                <CreditCard size={18} />
                                Finalizar Compra
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
