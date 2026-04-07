import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Users, ChevronRight, ShoppingCart, UserPlus, RefreshCw, Trash2 } from 'lucide-react';

export const CartManager: React.FC = () => {
    const navigate = useNavigate();
    const { availableCarts, switchCart, createCart, removeCart, isLoading, refreshCart } = useCart();
    const [isCreating, setIsCreating] = useState(false);
    const [newCartName, setNewCartName] = useState('');

    // Initial fetch for POS carts specifically
    useEffect(() => {
        refreshCart(true);
    }, [refreshCart]);

    // Use a more permissive render for debugging visibility issues.
    // The route itself is already protected by AdminRoute in App.tsx
    // if (!isAdmin) return null; 

    const handleCreateCart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCartName.trim()) return;
        await createCart(newCartName, true); // true = isPos
        setNewCartName('');
        setIsCreating(false);
    };

    return (
        <div className="cart-manager-container bg-opacity-10 bg-white backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20 shadow-2xl transition-all duration-300 hover:shadow-rose-500/10 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-geeko-cyan to-blue-600 rounded-lg shadow-lg">
                        <Users size={20} className="text-black" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Terminal de Atención</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-geeko-cyan font-black uppercase tracking-widest bg-geeko-cyan/10 px-2 py-0.5 rounded border border-geeko-cyan/20">
                                Terminal v20 • POS Session Logic
                            </span>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => refreshCart(true)}
                        disabled={isLoading}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all disabled:opacity-50"
                        title="Refrescar Lista"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    {!isCreating && (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-geeko-cyan hover:bg-geeko-cyan/80 text-black rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-geeko-cyan/20"
                        >
                            <UserPlus size={16} />
                            <span className="text-sm font-semibold">Nuevo Cliente</span>
                        </button>
                    )}
                </div>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateCart} className="mb-6 animate-in slide-in-from-top duration-300">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="Nombre del cliente..."
                            value={newCartName}
                            onChange={(e) => setNewCartName(e.target.value)}
                            className="flex-1 bg-slate-900 bg-opacity-50 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                        />
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="bg-geeko-cyan hover:bg-geeko-cyan/80 text-black px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-geeko-cyan/20 disabled:opacity-50"
                        >
                            Listo
                        </button>
                        <button 
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                        >
                            X
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCarts.map((cart) => (
                    <button
                        key={cart.id}
                        onClick={async () => {
                            await switchCart(cart.id);
                            navigate('/');
                        }}
                        className={`relative group flex items-start justify-between p-4 rounded-xl border transition-all duration-300 ${
                            cart.is_active 
                            ? 'bg-geeko-cyan bg-opacity-10 border-geeko-cyan shadow-[inset_0_0_20px_rgba(31,235,219,0.1)]' 
                            : 'bg-slate-800 bg-opacity-40 border-slate-700 hover:border-slate-500 hover:bg-opacity-60'
                        }`}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className={`text-sm font-bold ${cart.is_active ? 'text-geeko-cyan' : 'text-slate-200'}`}>
                                {cart.name || 'Sin nombre'}
                            </span>
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={12} className={cart.is_active ? 'text-geeko-cyan' : 'text-slate-500'} />
                                <span className="text-xs text-slate-400 font-medium">
                                    {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {cart.is_active ? (
                                <div className="flex items-center gap-1 bg-geeko-cyan text-black text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                                    Activo
                                </div>
                            ) : (
                                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                            )}
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeCart(cart.id);
                                }}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Eliminar Cliente"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {cart.is_active && (
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-geeko-cyan to-blue-500 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                        )}
                    </button>
                ))}

                {availableCarts.length === 0 && (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-800 rounded-xl">
                        <p className="text-slate-500 font-medium italic">No hay carritos activos actualmente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
