
import React, { useState } from 'react';
import { Save, Check, Loader2, ShoppingCart } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { addToCart } from '../../utils/api';
import { useCart } from '../../context/CartContext';

interface QuickStockItemProps {
    item: {
        product_id: string;
        name: string;
        condition: string;
        price: number;
        stock: number;
        image_url: string;
        set_code: string;
    };
}

export const QuickStockItem: React.FC<QuickStockItemProps> = ({ item }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempPrice, setTempPrice] = useState(item.price.toString());
    const [loading, setLoading] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(item.price);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const { refreshCart } = useCart();

    const handleSave = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        const newPrice = parseFloat(tempPrice);
        if (isNaN(newPrice) || newPrice <= 0) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({ price: newPrice })
                .eq('id', item.product_id);

            if (error) throw error;

            setCurrentPrice(newPrice);
            setIsEditing(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (err) {
            console.error('Error updating price:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAddingToCart(true);
        try {
            // Determine finish from condition (simplification)
            const finish = item.condition === 'Foil' ? 'foil' : 'nonfoil';
            const result = await addToCart(item.product_id, 1, finish);
            if (result && !result.success) {
                alert(result.message || 'Error al agregar');
            } else {
                await refreshCart();
                // We could show a tiny success animation here too
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div className="quick-stock-item flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
            {/* Image */}
            <div className="w-8 h-10 bg-slate-800 rounded overflow-hidden shadow-lg flex-shrink-0">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-white truncate">{item.name}</div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-mono uppercase">{item.set_code}</span>
                    <span className={`text-[8px] font-black px-1 rounded ${item.condition === 'NM' ? 'bg-green-500/20 text-green-400' :
                        item.condition === 'LP' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-500'
                        }`}>
                        {item.condition}
                    </span>
                </div>
            </div>

            {/* Stock */}
            <div className="text-right px-2 border-l border-white/5">
                <div className="text-[8px] text-slate-500 font-black uppercase">Stock</div>
                <div className={`text-xs font-black ${item.stock > 0 ? 'text-geeko-cyan' : 'text-red-500'}`}>
                    {item.stock}
                </div>
            </div>

            {/* Price Edit */}
            <div className="min-w-[60px] text-right">
                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            step="0.01"
                            value={tempPrice}
                            autoFocus
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave(e)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-12 bg-black/50 border border-geeko-cyan/50 rounded px-1 py-0.5 text-[10px] text-right text-white focus:outline-none"
                        />
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="text-green-400 hover:text-green-300 transition-colors"
                        >
                            {loading ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="group/price relative"
                    >
                        <div className={`text-[10px] font-black font-mono ${showSuccess ? 'text-green-400' : 'text-geeko-purple-light'}`}>
                            ${currentPrice.toFixed(2)}
                        </div>
                        {showSuccess && (
                            <div className="absolute -top-4 right-0">
                                <Check size={10} className="text-green-400 animate-bounce" />
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* Add to Cart Action */}
            <div className="pl-2 border-l border-white/5">
                <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || item.stock <= 0}
                    className={`p-2 rounded-lg transition-all ${
                        item.stock > 0 
                        ? 'bg-geeko-cyan/10 text-geeko-cyan hover:bg-geeko-cyan hover:text-black' 
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    title={item.stock > 0 ? "Añadir al carrito activo" : "Sin stock"}
                >
                    {isAddingToCart ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <ShoppingCart size={12} />
                    )}
                </button>
            </div>
        </div>
    );
};
