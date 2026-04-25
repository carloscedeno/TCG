import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogIn, Menu, X, ChevronDown, Package, Sparkles } from 'lucide-react';
import { SearchBar } from '../SearchBar/SearchBar';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../context/AuthContext';
import { fetchCart, fetchAccessoryCategories } from '../../utils/api';

interface HeaderProps {
    onCartOpen: () => void;
    cartCount: number;
}

export const Header = ({ onCartOpen, cartCount }: HeaderProps) => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const navigate = useNavigate();

    const tcgGames = [
        { name: 'Magic: The Gathering', code: 'MTG', icon: '🪄' },
        { name: 'Pokémon', code: 'PKM', icon: '🐹' },
        { name: 'Riftbound', code: 'RIFT', icon: '⚔️' },
        { name: 'One Piece', code: 'OP', icon: '🏴‍☠️' },
        { name: 'Gundam', code: 'GUNDAM', icon: '🤖' },
        { name: 'Digimon', code: 'DIGI', icon: '👾' },
        { name: 'Flesh and Blood', code: 'FAB', icon: '🩸' }
    ];

    useEffect(() => {
        const loadCategories = async () => {
            const cats = await fetchAccessoryCategories('ACCESSORIES');
            setCategories(cats || []);
        };
        loadCategories();
    }, []);

    const handleSearch = (val: string) => {
        setQuery(val);
        const newParams = new URLSearchParams(searchParams);
        if (val) newParams.set('q', val);
        else newParams.delete('q');
        setSearchParams(newParams);
    };

    const navigateToGame = (gameCode: string, mode: 'singles' | 'products') => {
        const tab = mode === 'singles' ? 'marketplace' : 'accessories';
        navigate(`/?game=${gameCode}&tab=${tab}`);
        setIsMobileMenuOpen(false);
    };

    const navigateToCategory = (catCode: string) => {
        navigate(`/?tab=accessories&category=${catCode}`);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
            {/* Top Bar: Logo & Search & User */}
            <div className="max-w-[1600px] mx-auto px-4 h-[70px] flex items-center justify-between gap-4">
                <Link to="/" className="flex-shrink-0 group relative">
                    <img src="/branding/Logo.png" alt="Geekorium" className="w-32 sm:w-40 object-contain group-hover:scale-105 transition-transform" />
                    <span className="absolute -top-1 -right-4 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md rotate-12 shadow-lg">BETA</span>
                </Link>

                <div className="flex-1 max-w-xl hidden lg:block">
                    <SearchBar value={query} onChange={handleSearch} placeholder="Buscar cartas, sobres o accesorios..." />
                </div>

                <div className="flex items-center gap-3">
                    {/* Socials (Desktop) */}
                    <div className="hidden xl:flex items-center gap-1 mr-2 px-3 border-r border-white/10">
                        <a href="https://instagram.com/geekorium/" target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-400 hover:text-geeko-cyan transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                        </a>
                    </div>

                    <button onClick={onCartOpen} className="relative p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-neutral-400 hover:text-geeko-cyan group">
                        <ShoppingCart size={20} />
                        {cartCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-geeko-cyan text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0a0a0a]">
                                {cartCount > 99 ? '99+' : cartCount}
                            </div>
                        )}
                    </button>

                    {user ? <UserMenu /> : (
                        <div className="hidden sm:block">
                             <Link to="/geeko-login" className="px-5 py-2.5 bg-geeko-cyan text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-geeko-cyan/80 transition-all transform active:scale-95 shadow-lg shadow-geeko-cyan/20 flex items-center gap-2">
                                <LogIn size={14} /> Conectarse
                            </Link>
                        </div>
                    )}

                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2.5 bg-neutral-900 border border-white/5 rounded-xl text-neutral-400">
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Navigation Bar: 8 Categories Matrix */}
            <nav className="hidden lg:block bg-black/40 border-t border-white/5">
                <div className="max-w-[1600px] mx-auto px-4 flex justify-between">
                    {tcgGames.map((game) => (
                        <div key={game.code} className="relative group px-1 py-3">
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-all group-hover:text-indigo-400">
                                <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{game.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-tighter">{game.name}</span>
                                <ChevronDown size={12} className="opacity-50 group-hover:rotate-180 transition-transform" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-0 w-48 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-xl mt-1 py-2 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                                <button onClick={() => navigateToGame(game.code, 'singles')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-600/20 text-xs font-bold transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]">Img</div>
                                    SINGLES
                                </button>
                                <button onClick={() => navigateToGame(game.code, 'products')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-600/20 text-xs font-bold transition-colors">
                                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]">Img</div>
                                    PRODUCTOS
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* 8th Category: Productos (Accessories) */}
                    <div className="relative group px-1 py-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 transition-all hover:bg-emerald-500/20">
                            <Package size={16} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">PRODUCTOS</span>
                            <ChevronDown size={12} className="opacity-50 group-hover:rotate-180 transition-transform" />
                        </button>
                        
                        <div className="absolute top-full right-0 w-56 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-xl mt-1 py-3 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                            <div className="px-4 mb-2">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Insumos Generales</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                                {categories.map((cat) => (
                                    <button 
                                        key={cat.code} 
                                        onClick={() => navigateToCategory(cat.code)}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-600/20 text-[11px] font-bold transition-colors"
                                    >
                                        <span className="text-base">{cat.icon}</span>
                                        {cat.name.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <button onClick={() => navigateToCategory('OTHER')} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-[11px] font-bold text-slate-400">
                                    <Sparkles size={14} /> OTROS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Search - shown only on small screens */}
            <div className="lg:hidden p-4 border-t border-white/5">
                <SearchBar value={query} onChange={handleSearch} placeholder="Buscar..." />
            </div>

            {/* Mobile Menu Overlay... (can be expanded later) */}
        </header>
    );
};
