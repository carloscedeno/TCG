import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, X, Search, ChevronDown } from 'lucide-react';
import { SearchBar } from '../SearchBar/SearchBar';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
    onCartOpen: () => void;
    cartCount: number;
}

export const Header = ({ onCartOpen, cartCount }: HeaderProps) => {
    const { user: _user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const navigate = useNavigate();

    const isDevEnv = import.meta.env.DEV || window.location.hostname.includes('dev') || window.location.hostname.includes('localhost');

    const tcgGames = [
        { name: 'Magic', code: 'MTG', icon: '/logos/tcg/MTG.png' },
        { name: 'Pokémon', code: 'PKM', icon: '/logos/tcg/PKM.png' },
        { name: 'Yu-Gi-Oh!', code: 'YGO', icon: '/logos/tcg/YGO.png' },
        { name: 'Riftbound', code: 'RFB', icon: '/logos/tcg/RFB.png' },
        { name: 'One Piece', code: 'OPC', icon: '/logos/tcg/OPC.png' },
        { name: 'Digimon', code: 'DGM', icon: '/logos/tcg/DGM.png' },
        { name: 'Gundam', code: 'GND', icon: '/logos/tcg/GND.png' },
        { name: 'Flesh and Blood', code: 'FAB', icon: '/logos/tcg/FAB.png' }
    ];

    useEffect(() => {
        const q = searchParams.get('q') || '';
        if (q !== query) setQuery(q);
    }, [searchParams]);

    useEffect(() => {
        const loadCategories = async () => {
            const { fetchAccessoryCategories } = await import('../../utils/api');
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

    const navigateToGame = (gameCode: string) => {
        const tab = gameCode === 'MTG' ? 'marketplace' : 'catalog';
        navigate(`/?game=${gameCode}&tab=${tab}`);
        setIsMobileMenuOpen(false);
    };

    const navigateToCategory = (catCode: string) => {
        navigate(`/?tab=catalog&category=${catCode}`);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
            {/* Top Bar: Logo & Search & User */}
            <div className="max-w-[1600px] mx-auto px-4 h-[60px] flex items-center justify-between gap-4">
                <Link to="/" className="flex-shrink-0 group relative">
                    <img src="/branding/Logo.png" alt="Geekorium" className="w-28 sm:w-32 object-contain group-hover:scale-105 transition-transform" />
                    <span className="absolute -top-1 -right-4 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md rotate-12 shadow-lg">BETA</span>
                </Link>

                {/* Main Utility Nav - Always show on PC */}
                <nav className="hidden lg:flex items-center gap-6 xl:gap-10">
                    {['Home', 'Artilugios', 'Hechizos', 'Misiones', 'Invócanos'].map((item) => (
                        <Link 
                            key={item}
                            to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                            className="text-[12px] xl:text-[13px] font-bold text-neutral-400 hover:text-white transition-all relative group py-2"
                        >
                            {item}
                            {item === 'Home' && (
                                <div className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-geeko-cyan-neon rounded-full" />
                            )}
                            <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-geeko-cyan-neon transition-all duration-300 rounded-full" />
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart & Auth */}
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="hidden lg:block w-48 xl:w-64 2xl:w-80 transition-all duration-500">
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-geeko-cyan-neon transition-colors" />
                            <input 
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full bg-neutral-900/50 border border-white/10 rounded-full py-2 pl-10 pr-4 text-[11px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-geeko-cyan-neon/50 focus:ring-1 focus:ring-geeko-cyan-neon/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onCartOpen} className="relative p-2 text-neutral-400 hover:text-white transition-all">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-geeko-cyan-neon text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </div>
                            )}
                        </button>
                        <UserMenu />
                        <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Bar: 8 Categories Matrix */}
            <nav className="hidden lg:block bg-black/40 border-t border-white/5">
                <div className="max-w-[1600px] mx-auto px-4 flex justify-between">
                    {tcgGames.map((game) => {
                        const isActive = searchParams.get('game') === game.code;
                        return (
                        <div key={game.code} className="relative group px-1 py-1.5">
                             {game.code === 'MTG' ? (
                                <button onClick={() => navigateToGame(game.code)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-white/10 text-indigo-400' : 'hover:bg-white/5 group-hover:text-indigo-400'}`}>
                                    <img src={game.icon} alt={game.name} className={`w-5 h-5 object-contain transition-all ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">SINGLES</span>
                                </button>
                            ) : (
                                <button onClick={() => navigateToGame(game.code)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isActive ? 'bg-white/10 text-indigo-400' : 'hover:bg-white/5 group-hover:text-indigo-400'}`}>
                                    <img src={game.icon} alt={game.name} className={`w-5 h-5 object-contain transition-all ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{game.name}</span>
                                </button>
                            )}
                        </div>
                    )})}

                    {/* 8th Category: Productos (Accessories) - ONLY IN DEV */}
                    {isDevEnv && (
                        <div className="relative group px-1 py-1.5">
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 transition-all hover:bg-emerald-500/20">
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
                                        OTROS
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile Search - shown only on small screens */}
            <div className="lg:hidden p-4 border-t border-white/5">
                <SearchBar value={query} onChange={handleSearch} placeholder="Buscar..." />
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] bg-[#0a0a0a] overflow-y-auto animate-in fade-in duration-200">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <img src="/branding/Logo.png" alt="Geekorium" className="w-28 object-contain" />
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-neutral-900 border border-white/5 rounded-xl text-neutral-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* TCG Sections */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">TCG Catalog</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {tcgGames.map(game => (
                                    <button 
                                        key={game.code}
                                        onClick={() => navigateToGame(game.code)}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 text-left transition-all active:scale-95"
                                    >
                                        <img src={game.icon} alt={game.name} className="w-8 h-8 object-contain" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{game.name}</span>
                                            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
                                                {game.code === 'MTG' ? 'Ver Stock' : 'Ver Catálogo'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accessories */}
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Productos & Accesorios</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.code} 
                                        onClick={() => navigateToCategory(cat.code)}
                                        className="flex flex-col items-center gap-2 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-all"
                                    >
                                        <span className="text-2xl">{cat.icon}</span>
                                        <span className="text-[10px] font-bold text-emerald-400 text-center uppercase tracking-tighter">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
