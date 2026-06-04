import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu as MenuIcon, X, Search } from 'lucide-react';
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



    const tcgGames = [
        { name: 'Magic', code: 'MTG', icon: '/logos/tcg/MTG.png' },
        { name: 'Pokémon', code: 'PKM', icon: '/logos/tcg/PKM.png' },
        { name: 'Yu-Gi-Oh!', code: 'YGO', icon: '/logos/tcg/YGO.png' },
        { name: 'Riftbound', code: 'RFB', icon: '/logos/tcg/RFB.png' },
        { name: 'One Piece', code: 'OPC', icon: '/logos/tcg/OPC.png' },
        { name: 'Digimon', code: 'DGM', icon: '/logos/tcg/DGM.png' },
        { name: 'Gundam', code: 'GND', icon: '/logos/tcg/GND.png' },
        { name: 'Flesh and Blood', code: 'FAB', icon: '/logos/tcg/FAB.png' },
        { name: 'Otros', code: 'OTHERS', icon: '/logos/tcg/OTHERS.png' }
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
            <div className="max-w-[1600px] mx-auto px-4 h-14 lg:h-[60px] flex items-center justify-between gap-12">
                <Link to="/" className="flex-shrink-0 group relative">
                    <img src="/branding/Logo.png" alt="Geekorium" className="w-28 sm:w-40 object-contain group-hover:scale-105 transition-transform" />
                    <span className="absolute -top-1 -right-4 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md rotate-12 shadow-lg">BETA</span>
                </Link>

                {/* Main Utility Nav - Always show on PC */}
                <nav className="hidden lg:flex items-center gap-8 xl:gap-14">
                    {[
                        { name: 'Home', path: '/' },
                        { name: 'Artilugios', path: '/?tab=catalog' }
                    ].map((item) => (
                        <Link 
                            key={item.name}
                            to={item.path}
                            className="text-sm xl:text-base font-bold text-text-low hover:text-text-high transition-all relative group py-2"
                        >
                            {item.name}
                            {item.name === 'Home' && !searchParams.get('tab') && (
                                <div className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-white rounded-full" />
                            )}
                            <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300 rounded-full" />
                        </Link>
                    ))}
                </nav>

                {/* Search & Cart & Auth */}
                <div className="flex-1 max-w-2xl hidden lg:block mx-auto transition-all duration-500">
                    <div className="relative group">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-low group-focus-within:text-geeko-cyan transition-colors" />
                        <input 
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full bg-neutral-900/50 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-[11px] text-white placeholder:text-neutral-600 focus:outline-none focus:border-geeko-cyan/50 focus:ring-1 focus:ring-geeko-cyan/20 transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-3">
                        <button onClick={onCartOpen} data-testid="cart-button" className="hidden lg:flex relative p-2 text-text-low hover:text-text-high transition-all">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <div className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </div>
                            )}
                        </button>
                        <div className="hidden lg:block">
                            <UserMenu />
                        </div>
                        <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            {isMobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Bar: 8 Categories Matrix -> REPLACED WITH CIRCULAR SELECTOR */}
            <nav className="hidden lg:block bg-black/40 border-t border-white/5 py-2">
                <div className="max-w-[1600px] mx-auto px-4 flex justify-center items-center gap-8 xl:gap-14 h-20">
                    {tcgGames.map((game) => {
                        const isActive = searchParams.get('game') === game.code;
                        return (
                            <button 
                                key={game.code}
                                onClick={() => navigateToGame(game.code)}
                                className="group flex flex-col items-center gap-2 transition-all duration-300"
                            >
                                <div className={`w-11 h-11 xl:w-14 xl:h-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur-sm'}`}>
                                    <img src={game.icon} alt={game.name} className={`w-6 h-6 xl:w-9 xl:h-9 object-contain transition-all ${isActive ? 'grayscale-0 scale-110' : 'grayscale group-hover:grayscale-0 group-hover:scale-110'}`} />
                                </div>
                                <span className={`text-[11px] xl:text-[14px] font-black italic uppercase tracking-tighter transition-all ${isActive ? 'text-text-high' : 'text-text-low group-hover:text-neutral-300'}`}>
                                    {game.code === 'MTG' ? 'MTG' : game.name}
                                </span>
                            </button>
                        );
                    })}

                    {/* Integrated Productos Category - REMOVED AS PER REQUEST */}

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
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-neutral-900 border border-white/5 rounded-xl text-text-low">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* TCG Sections */}
                        <div>
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] mb-4">TCG Catalog</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {tcgGames.map(game => (
                                    <button 
                                        key={game.code}
                                        onClick={() => navigateToGame(game.code)}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 text-left transition-all active:scale-95"
                                    >
                                        <img src={game.icon} alt={game.name} className="w-10 h-10 object-contain" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{game.name}</span>
                                            <span className="text-[10px] text-text-low uppercase tracking-widest">
                                                {game.code === 'MTG' ? 'Ver Stock' : 'Ver Catálogo'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accessories */}
                        <div>
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] mb-4">Productos & Accesorios</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.code} 
                                        onClick={() => navigateToCategory(cat.code)}
                                        className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                    >
                                        <span className="text-2xl">{cat.icon}</span>
                                        <span className="text-[10px] font-bold text-white text-center uppercase tracking-tighter">{cat.name}</span>
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
