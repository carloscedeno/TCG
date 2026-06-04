import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, Menu, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { CartDrawer } from './CartDrawer';
import { MobileMenuDrawer } from './MobileMenuDrawer';

export const BottomNav = () => {
    const location = useLocation();
    const { cartCount } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Disable BottomNav on Admin pages to avoid overlapping with admin tools
    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    const isHome = location.pathname === '/' && !location.search.includes('tab=catalog');
    const isCatalog = location.search.includes('tab=catalog');

    return (
        <>
            <nav className="lg:hidden fixed bottom-0 left-0 w-full z-[100] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 pb-safe">
                <div className="flex items-center justify-around h-16 px-2">
                    <Link to="/" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isHome ? 'text-geeko-cyan' : 'text-text-low hover:text-white'}`}>
                        <Home size={22} className={isHome ? 'drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Inicio</span>
                    </Link>

                    <Link to="/?tab=catalog" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isCatalog ? 'text-geeko-cyan' : 'text-text-low hover:text-white'}`}>
                        <Grid size={22} className={isCatalog ? 'drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Catálogo</span>
                    </Link>

                    <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center justify-center w-full h-full text-text-low hover:text-white relative">
                        <div className="relative">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <div className="absolute -top-1.5 -right-2 bg-geeko-cyan text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,209,255,0.5)]">
                                    {cartCount}
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] mt-1 font-bold">Carrito</span>
                    </button>

                    <button onClick={() => setIsMenuOpen(true)} className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isMenuOpen ? 'text-geeko-cyan' : 'text-text-low hover:text-white'}`}>
                        <Menu size={22} className={isMenuOpen ? 'drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]' : ''} />
                        <span className="text-[10px] mt-1 font-bold">Menú</span>
                    </button>
                </div>
            </nav>
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <MobileMenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
};
