import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Users, ChevronRight, ShoppingCart, UserPlus } from 'lucide-react';

export const CartManager: React.FC = () => {
    const { isAdmin } = useAuth();
    const { availableCarts, switchCart, createCart, isLoading } = useCart();
    const [isCreating, setIsCreating] = useState(false);
    const [newCartName, setNewCartName] = useState('');

    if (!isAdmin) return null;

    const handleCreateCart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCartName.trim()) return;
        await createCart(newCartName);
        setNewCartName('');
        setIsCreating(false);
    };

    return (
        <div className="cart-manager-container bg-opacity-10 bg-white backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20 shadow-2xl transition-all duration-300 hover:shadow-rose-500/10 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg shadow-lg">
                        <Users size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Gestión de Clientes</h3>
                        <p className="text-xs text-slate-400 font-medium">Atención física en tienda</p>
                    </div>
                </div>
                
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-rose-600/20"
                    >
                        <UserPlus size={16} />
                        <span className="text-sm font-semibold">Nuevo Cliente</span>
                    </button>
                )}
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
                            className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 disabled:opacity-50"
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
                        onClick={() => switchCart(cart.id)}
                        className={`relative group flex items-start justify-between p-4 rounded-xl border transition-all duration-300 ${
                            cart.is_active 
                            ? 'bg-rose-500 bg-opacity-20 border-rose-500 shadow-inner' 
                            : 'bg-slate-800 bg-opacity-40 border-slate-700 hover:border-slate-500 hover:bg-opacity-60'
                        }`}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className={`text-sm font-bold ${cart.is_active ? 'text-rose-400' : 'text-slate-200'}`}>
                                {cart.name || 'Sin nombre'}
                            </span>
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={12} className={cart.is_active ? 'text-rose-400' : 'text-slate-500'} />
                                <span className="text-xs text-slate-400 font-medium">
                                    {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                        </div>
                        
                        {cart.is_active ? (
                            <div className="flex items-center gap-1 bg-rose-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                                Activo
                            </div>
                        ) : (
                            <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}

                        {cart.is_active && (
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-purple-600 rounded-xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
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
