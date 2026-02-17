import React, { useEffect, useState } from 'react';
import { rarityMap } from '../utils/translations';
import { CardGrid } from '../components/Card/CardGrid';
import { CardModal } from '../components/Card/CardModal';
import type { CardProps } from '../components/Card/Card';
import { fetchCards, fetchSets, fetchProducts, fetchCart } from '../utils/api';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { FiltersPanel } from '../components/Filters/FiltersPanel';
import type { Filters } from '../components/Filters/FiltersPanel';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { UserMenu } from '../components/Navigation/UserMenu';

import { LogIn, X, ShoppingCart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { Footer } from '../components/Navigation/Footer';

const mockFilters: Filters = {
  games: ['Magic: The Gathering'],
  rarities: ['Common', 'Uncommon', 'Rare', 'Mythic'],
  colors: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'],
  types: ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'],
  sets: [],
  yearRange: [1993, 2026]
};

const colorCodeMap: Record<string, string> = {
  'White': 'W',
  'Blue': 'U',
  'Black': 'B',
  'Red': 'R',
  'Green': 'G',
  'Colorless': 'C',
  'Multicolor': 'M'
};

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<(CardProps & { card_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<Partial<Filters>>({
    games: searchParams.get('game')?.split(',').map(g => {
      if (g === 'MTG') return 'Magic: The Gathering';
      return g;
    }).filter(Boolean) || ['Magic: The Gathering'],
    sets: searchParams.get('set')?.split(',').filter(Boolean) || [],
    rarities: searchParams.get('rarity')?.split(',').filter(Boolean) || []
  });
  const [sets, setSets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'release_date');
  const [activeRarity, setActiveRarity] = useState(searchParams.get('rarity') || 'All');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'reference'>((searchParams.get('tab') as 'marketplace' | 'reference') || 'reference');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Cart count state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const LIMIT = 50;

  // Cart Count Logic
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const { items } = await fetchCart();
        const count = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
        setCartCount(count);
      } catch (error) {
        console.error("Failed to fetch cart count", error);
        setCartCount(0);
      }
    };

    updateCartCount();

    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
    };
  }, [user]); // Re-run when user changes

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== debouncedQuery) {
        setDebouncedQuery(query);
        setPage(0);
      }
    }, 300); // Optimized from 500ms for better responsiveness
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);

  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const offset = page * LIMIT;

      try {
        let result: { cards: (CardProps & { card_id: string })[], total_count: number };

        if (activeTab === 'marketplace') {
          // Normalize game names for RPC mapping
          const mappedGame = filters.games?.[0] ? (
            filters.games[0] === 'Magic: The Gathering' ? 'MTG' :
              filters.games[0] === 'Pokémon' ? 'PKM' :
                filters.games[0]
          ) : undefined;

          const productRes = await fetchProducts({
            q: debouncedQuery || undefined,
            game: mappedGame,
            set: filters.sets && filters.sets.length > 0 ? filters.sets.join(',') : undefined,
            rarity: activeRarity !== 'All' ? activeRarity : (filters.rarities && filters.rarities.length > 0 ? filters.rarities.join(',') : undefined),
            color: filters.colors && filters.colors.length > 0 ? filters.colors.map(c => colorCodeMap[c] || c) : undefined,
            type: filters.types && filters.types.length > 0 ? filters.types : undefined,
            year_from: filters.yearRange ? filters.yearRange[0] : undefined,
            year_to: filters.yearRange ? filters.yearRange[1] : undefined,
            limit: LIMIT,
            offset,
            sort: sortBy === 'price' ? 'price_desc' : sortBy
          });

          result = {
            cards: productRes.products.map((p: any) => ({
              card_id: p.printing_id || p.id,
              name: p.name,
              set: p.set_code || 'Unknown',
              price: Number(p.price) || 0,
              image_url: p.image_url,
              rarity: p.rarity,
              total_stock: Number(p.stock) || 0,
            })),
            total_count: productRes.total_count
          };
        } else {
          const cardRes = await fetchCards({
            q: debouncedQuery || undefined,
            rarity: activeRarity !== 'All' ? activeRarity : (filters.rarities && filters.rarities.length > 0 ? filters.rarities.join(',') : undefined),
            game: filters.games && filters.games.length > 0 ? filters.games.join(',') : undefined,
            set: filters.sets && filters.sets.length > 0 ? filters.sets.join(',') : undefined,
            color: filters.colors && filters.colors.length > 0 ? filters.colors.map(c => colorCodeMap[c] || c).join(',') : undefined,
            type: filters.types && filters.types.length > 0 ? filters.types.join(',') : undefined,
            year_from: filters.yearRange ? filters.yearRange[0] : undefined,
            year_to: filters.yearRange ? filters.yearRange[1] : undefined,
            limit: LIMIT,
            offset,
            sort: sortBy
          });

          result = {
            cards: cardRes.cards.map(c => ({
              ...c,
              card_id: c.card_id
            })),
            total_count: cardRes.total_count
          };
        }

        if (ignore) return;

        if (offset === 0) {
          setCards(result.cards);
        } else {
          setCards(prev => {
            // Prevent duplicates when appending
            const existingIds = new Set(prev.map(c => c.card_id));
            const newCards = result.cards.filter(c => !existingIds.has(c.card_id));
            return [...prev, ...newCards];
          });
        }
        setTotalCount(result.total_count);
      } catch (err: any) {
        if (!ignore) {
          setError('Failed to fetch cards. Please try again later.');
          console.error(err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Update URL Search Params
    const newParams = new URLSearchParams();
    if (debouncedQuery) newParams.set('q', debouncedQuery);
    if (filters.games && filters.games.length > 0) {
      newParams.set('game', filters.games.map(g => {
        if (g === 'Magic: The Gathering') return 'MTG';
        return g;
      }).join(','));
    }
    if (filters.sets && filters.sets.length > 0) newParams.set('set', filters.sets.join(','));
    if (activeRarity !== 'All') newParams.set('rarity', activeRarity);
    else if (filters.rarities && filters.rarities.length > 0) newParams.set('rarity', filters.rarities.join(','));
    if (sortBy !== 'release_date') newParams.set('sort', sortBy);
    if (activeTab !== 'reference') newParams.set('tab', activeTab);

    setSearchParams(newParams, { replace: true });

    return () => {
      ignore = true;
    };
  }, [debouncedQuery, filters, activeRarity, sortBy, page, activeTab]);

  useEffect(() => {
    const gameCodeMap: Record<string, string> = {
      'Magic: The Gathering': 'MTG',
      'MTG': 'MTG'
    };

    // Si no hay juegos seleccionados en filtros, usamos MTG por defecto
    const activeGame = filters.games && filters.games.length > 0 ? filters.games[0] : 'MTG';

    fetchSets(gameCodeMap[activeGame] || 'MTG')
      .then(realSets => {
        const setNames = realSets.map((s: any) => s.set_name);
        setSets(setNames);
      })
      .catch(() => setSets([]));
  }, [filters.games]);

  const rarities = ['All', 'Mythic', 'Rare', 'Uncommon', 'Common'];

  // Helper to update filters and reset page
  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(newFilters);
    setPage(0);
  };

  const handleRarityChange = (rarity: string) => {
    setActiveRarity(rarity);
    setPage(0);
  };

  const handleTabChange = (tab: 'marketplace' | 'reference') => {
    setActiveTab(tab);
    setPage(0);
    setCards([]); // Clear cards to avoid showing stale data during tab switch
  };



  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-cyan-500/30">

      {/* Ambient Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">

        {/* Header */}
        <header className="min-h-[70px] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl flex items-center">
          <nav className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-y-2">
            <div className="flex items-center gap-4 sm:gap-8">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="flex items-center justify-center font-black text-2xl italic text-white group-hover:scale-105 transition-transform tracking-tighter">
                  <img src="/branding/Logo.jpg" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 border border-white/10 shadow-lg shadow-geeko-cyan/10" />
                  <span className="text-geeko-cyan">Geekorium</span>
                  <span className="hidden md:inline">&nbsp;El Emporio</span>
                </div>
                <h1 className="hidden">Geekorium El Emporio</h1>
              </Link>
            </div>
            <div className="flex-1 max-w-xl mx-4 sm:mx-8 hidden lg:block">
              <SearchBar value={query} onChange={setQuery} placeholder="Buscar por nombre de carta o edición..." />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              {/* Mobile Search - shown only on small screens */}
              <div className="lg:hidden text-black mr-1 sm:mr-2">
                {/* Only show icon or small bar? For now keep existing but maybe smaller? */}
                {/* SearchBar component handles its own styles, hopefully it fits. */}
                {/* Actually, SearchBar might be too wide. Let's hide full bar on very small? */}
                {/* Current implementation shows it. I'll leave it but ensure container doesn't break it */}
                <div className="w-32 sm:w-48">
                  <SearchBar value={query} onChange={setQuery} placeholder="Buscar..." />
                </div>
              </div>

              {/* Help Link */}
              <Link to="/help" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-white/5 rounded-full text-neutral-400 hover:text-geeko-cyan hover:border-geeko-cyan/30 transition-all group mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Ayuda</span>
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-geeko-cyan/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
                </span>
              </Link>

              {/* Social Icons at Top */}
              <div className="hidden sm:flex items-center gap-1 mr-2 px-3 border-r border-white/10">
                <a href="https://instagram.com/geekorium/" target="_blank" rel="noopener noreferrer" title="Instagram" className="p-2 text-neutral-400 hover:text-geeko-cyan transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </a>
                <a href="https://www.tiktok.com/@geekorium" target="_blank" rel="noopener noreferrer" title="TikTok" className="p-2 text-neutral-400 hover:text-geeko-cyan transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a6.738 6.738 0 01-1.45 4.15c-1.29 1.41-3.14 2.21-5.04 2.1c-1.95.05-3.89-.72-5.18-2.18-1.34-1.52-1.92-3.66-1.58-5.64.3-1.84 1.64-3.47 3.44-4.04 1.02-.34 2.13-.39 3.19-.15V17c-.89-.28-1.93-.11-2.69.49-.66.52-1 1.34-1.02 2.17.02 1.35 1.45 2.18 2.63 1.8 1.07-.32 1.83-1.4 1.81-2.5V3.81c0-1.27-.01-2.53-.01-3.79h-.02z" />
                  </svg>
                </a>
                <a href="https://discord.gg/wmYhWw5Q" target="_blank" rel="noopener noreferrer" title="Discord" className="p-2 text-neutral-400 hover:text-geeko-cyan transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 12c-2 0-3.5 1.5-3.5 3.5v2.5h16v-2.5c0-2-1.5-3.5-3.5-3.5h-9z" /><circle cx="9" cy="9" r="2" /><circle cx="15" cy="9" r="2" /></svg>
                </a>
              </div>

              {/* Cart Button - Always Visible */}
              <button
                onClick={() => setIsCartOpen(true)}
                data-testid="cart-button"
                className="relative p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-neutral-400 hover:text-geeko-cyan group"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <div id="cart-badge" className="absolute -top-1 -right-1 bg-geeko-cyan text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#0a0a0a]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </div>
                )}
              </button>

              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-geeko-cyan hover:bg-geeko-cyan/80 text-black font-black py-2 px-5 rounded-full shadow-lg shadow-geeko-cyan/20 transition-all transform active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest whitespace-nowrap"
                >
                  <LogIn size={14} /> <span className="hidden sm:inline">Conectarse</span>
                </button>
              )}
            </div>
          </nav>
        </header>



        {/* Rarity Filter Tabs & Sort */}
        <div className="bg-[#0a0a0a]/95 border-b border-neutral-800 sticky top-[70px] z-40 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                <button
                  onClick={() => handleTabChange('marketplace')}
                  data-testid="inventory-tab"
                  className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ring-2 ring-geeko-cyan/30 flex items-center gap-2 ${activeTab === 'marketplace'
                    ? 'bg-geeko-cyan text-black shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  <img src="/branding/Emporio.jpg" alt="Icon" className="w-5 h-5 rounded-full" />
                  Stock Geekorium
                </button>
                <button
                  onClick={() => handleTabChange('reference')}
                  data-testid="archives-tab"
                  className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'reference'
                    ? 'bg-neutral-700 text-white shadow-lg'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  <img src="/branding/Misiones.jpg" alt="Icon" className="w-5 h-5 rounded-full" />
                  Archivo
                </button>
              </div>

              <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                {rarities.map(r => (
                  <button
                    key={r}
                    onClick={() => handleRarityChange(r)}
                    className={`px-3 md:px-6 py-2 rounded-full text-[9px] md:text-[11px] font-black tracking-widest uppercase transition-all ${activeRarity === r
                      ? 'bg-neutral-700 text-white shadow-lg'
                      : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    {rarityMap[r] || r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-neutral-400 flex items-center gap-2"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  {Object.values(filters).some(v => v && v.length > 0) && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filtros</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-tighter text-neutral-500 hidden sm:inline">Ordenar:</span>
                <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                  <button
                    onClick={() => setSortBy(sortBy === 'name' ? 'name_desc' : 'name')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${sortBy.includes('name') ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Nombre {sortBy === 'name' ? '↓' : (sortBy === 'name_desc' ? '↑' : '⇅')}
                  </button>
                  <button
                    onClick={() => setSortBy(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${sortBy.includes('price') ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Precio {sortBy === 'price_asc' ? '↑' : (sortBy === 'price_desc' ? '↓' : '⇅')}
                  </button>
                  <button
                    onClick={() => setSortBy(sortBy === 'release_date' ? 'release_date_asc' : 'release_date')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${sortBy.includes('release_date') ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Fecha {sortBy === 'release_date' ? '↓' : (sortBy === 'release_date_asc' ? '↑' : '⇅')}
                  </button>
                </div>
              </div>

              <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-geeko-cyan shadow-inner' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="Grid View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-geeko-cyan shadow-inner' : 'text-neutral-500 hover:text-neutral-300'}`}
                  title="List View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto pr-2 custom-scrollbar">
                <FiltersPanel
                  filters={{ ...mockFilters, sets }}
                  selected={filters}
                  onChange={handleFilterChange}
                  setsOptions={sets}
                />
              </div>
            </aside>

            {/* Cards Grid */}
            <div className="flex-1">
              {loading && page === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-neutral-500 font-black text-xs tracking-widest uppercase animate-pulse">Invocando Cartas...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-red-900/5 border border-red-900/10 rounded-3xl">
                  <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="text-2xl text-red-500">!</div>
                  </div>
                  <h3 className="text-xl font-bold text-red-500 mb-2">Error de Conexión</h3>
                  <p className="text-neutral-500 text-sm max-w-md mx-auto">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-8 py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-600/20"
                  >
                    Recargar Página
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Active Filters Tokens */}
                  {(Object.values(filters).some(v => v && v.length > 0) || activeRarity !== 'All' || debouncedQuery) && (
                    <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mr-2">Activo:</span>

                      {debouncedQuery && (
                        <button onClick={() => { setQuery(''); setPage(0); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400 hover:bg-blue-600/20 transition-all group">
                          Búsqueda: {debouncedQuery}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      )}

                      {filters.games?.map(g => (
                        <button key={g} onClick={() => handleFilterChange({ ...filters, games: filters.games?.filter(x => x !== g) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 border border-purple-500/30 rounded-full text-[10px] font-bold text-purple-400 hover:bg-purple-600/20 transition-all group">
                          {g}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      {filters.sets?.map(s => (
                        <button key={s} onClick={() => handleFilterChange({ ...filters, sets: filters.sets?.filter(x => x !== s) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400 hover:bg-emerald-600/20 transition-all group">
                          Edición: {s}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      {filters.colors?.map(c => (
                        <button key={c} onClick={() => handleFilterChange({ ...filters, colors: filters.colors?.filter(x => x !== c) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/10 border border-cyan-500/30 rounded-full text-[10px] font-bold text-cyan-400 hover:bg-cyan-600/20 transition-all group">
                          {c}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      {filters.types?.map(t => (
                        <button key={t} onClick={() => handleFilterChange({ ...filters, types: filters.types?.filter(x => x !== t) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 hover:bg-red-600/20 transition-all group">
                          {t}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      <button onClick={() => { setFilters({}); setQuery(''); setActiveRarity('All'); setPage(0); }} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors ml-2 underline underline-offset-4 decoration-neutral-800">
                        Limpiar Todo
                      </button>
                    </div>
                  )}

                  <CardGrid cards={cards} onCardClick={setSelectedCardId} viewMode={viewMode} />
                  {cards.length < totalCount && (
                    <div className="flex justify-center pb-20">
                      <button
                        onClick={() => setPage((p: number) => p + 1)}
                        disabled={loading}
                        className="group relative overflow-hidden px-12 py-5 bg-neutral-900 border border-neutral-800 rounded-full font-black text-[11px] tracking-[0.2em] uppercase hover:border-blue-500/50 transition-all flex items-center gap-4 disabled:opacity-50 shadow-2xl"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Cargar Más Cartas'
                        )}
                        {!loading && <span className="text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded-md">[{totalCount - cards.length}]</span>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* How to Buy Section */}
        <section id="how-to-buy" className="max-w-[1600px] mx-auto px-6 mb-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#f4e4bc] p-12 shadow-2xl">
            {/* Decorative Parchment Elements */}
            <div className="absolute top-0 left-0 w-full h-4 bg-black/5" />
            <div className="absolute bottom-0 left-0 w-full h-4 bg-black/5" />

            <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-4xl font-black text-black italic tracking-tighter mb-6 uppercase flex items-center gap-4 justify-center md:justify-start">
                  <img src="/branding/Misiones.jpg" alt="Scroll" className="w-12 h-12 rounded-full border-2 border-black/10 shadow-lg" />
                  ¿Cómo comprar en Geekorium El Emporio?
                </h2>
                <p className="text-black/70 font-medium text-lg leading-relaxed max-w-2xl mb-8">
                  Nuestra plataforma es un <strong>Portafolio Online</strong> diseñado para ofrecerte la mejor experiencia de búsqueda y selección de singles. Sigue estos pasos para completar tu pedido:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-2xl font-black text-black italic">1</div>
                    <div className="font-bold text-black uppercase tracking-wider text-sm">Explora el Stock</div>
                    <p className="text-black/60 text-xs font-medium leading-relaxed">Filtra por TCG, rareza o edición. Encuentra exactamente lo que buscas en nuestro inventario real.</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-2xl font-black text-black italic">2</div>
                    <div className="font-bold text-black uppercase tracking-wider text-sm">Prepara tu Orden</div>
                    <p className="text-black/60 text-xs font-medium leading-relaxed">Añade al carrito. Verás el <strong>Market Price</strong> y nuestro <strong>GK Price</strong> especial.</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-2xl font-black text-black italic">3</div>
                    <div className="font-bold text-black uppercase tracking-wider text-sm">Finaliza con un Asesor</div>
                    <p className="text-black/60 text-xs font-medium leading-relaxed">Tu pedido llegará a WhatsApp, donde un Geeko-Asesor validará disponibilidad y coordinará el pago.</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/3 flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-geeko-cyan/20 blur-3xl rounded-full group-hover:bg-geeko-cyan/30 transition-all" />
                  <img
                    src="/branding/Emporio.jpg"
                    alt="Emporio Seal"
                    className="relative w-48 h-48 rounded-full border-8 border-white/20 shadow-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <CardModal
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
          onAddToCartSuccess={() => {
            setIsCartOpen(true);
            // trigger cart refresh? CartDrawer loads on open, so yes.
          }}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Mobile Filters Drawer */}
        {
          isMobileFiltersOpen && (
            <div className="fixed inset-0 z-[100] lg:hidden">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-[#0a0a0a] border-l border-white/5 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black italic tracking-tighter">FILTROS</h2>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-white/5 rounded-lg text-neutral-400">
                    <X size={20} />
                  </button>
                </div>
                <FiltersPanel
                  filters={{ ...mockFilters, sets }}
                  selected={filters}
                  onChange={handleFilterChange}
                  setsOptions={sets}
                />
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full mt-8 py-4 bg-geeko-cyan text-black font-black text-xs uppercase tracking-widest rounded-xl"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          )
        }
      </div >
    </div >
  );
};

export default Home;