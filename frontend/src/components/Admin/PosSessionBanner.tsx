import React from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PosSessionBanner: React.FC = () => {
    const { isAdmin } = useAuth();
    const { currentIsPos, activeCartName } = useCart();
    const navigate = useNavigate();

    // Only show for admins when a POS cart is active
    if (!isAdmin || !currentIsPos || !activeCartName) return null;

    return (
        <div className="sticky top-0 z-[60] bg-geeko-cyan text-black px-4 py-2 shadow-[0_4px_20px_rgba(31,235,219,0.3)] animate-in slide-in-from-top duration-500">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-black/10 p-1.5 rounded-lg">
                        <ShoppingBag size={18} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Sesión POS Activa:</span>
                        <span className="text-sm font-black uppercase tracking-tight">{activeCartName}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate('/admin/customers')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <ArrowLeft size={14} />
                        <span className="hidden sm:inline">Terminal</span>
                    </button>
                    <button 
                        onClick={async () => {
                            // In a full implementation, this might 'close' the session
                            // For now, we just go back to terminal to select another or clear
                            navigate('/admin/customers');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-geeko-cyan rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        <CheckCircle size={14} />
                        <span className="hidden sm:inline">Finalizar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
