import React, { useEffect, useState } from 'react';
import { rarityMap } from '../utils/translations';
import { CardGrid } from '../components/Card/CardGrid';
import { CardModal } from '../components/Card/CardModal';
import type { CardProps } from '../components/Card/Card';
import { fetchCards, fetchSets, fetchProducts, fetchCart, fetchAccessories } from '../utils/api';
import { FiltersPanel } from '../components/Filters/FiltersPanel';
import type { Filters } from '../components/Filters/FiltersPanel';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { X, Sparkles, Search } from 'lucide-react';

import { useSearchParams } from 'react-router-dom';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { Footer } from '../components/Navigation/Footer';
import { Header } from '../components/Navigation/Header';
import { HeroSection } from '../components/Home/HeroSection';

const mockFilters: Filters = {
  games: ['MTG', 'PKM', 'OPC', 'DGM'],
  rarities: ['Common', 'Uncommon', 'Rare', 'Mythic'],
  colors: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'],
  types: ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'],
  categories: ['Accesorios', 'Sealed Product', 'Consumibles', 'Magic', 'Pokemon', 'Digimon', 'One Piece', 'Yu-Gi-Oh', 'Weiss Schwarz', 'Concesión', 'Other'],
  sets: [],
  yearRange: [1993, 2026],
  priceRange: [0, 1000]
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
  const isDevEnv = import.meta.env.DEV || window.location.hostname.includes('dev') || window.location.hostname.includes('localhost');
  const [searchParams, setSearchParams] = useSearchParams();
  const [cards, setCards] = useState<(CardProps & { card_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<Partial<Filters>>({
    games: searchParams.get('game')?.split(',').filter(Boolean) || [],
    sets: searchParams.get('set')?.split(',').filter(Boolean) || [],
    rarities: searchParams.get('rarity')?.split(',').filter(Boolean) || [],
    categories: searchParams.get('category')?.split(',').filter(Boolean) || [],
    yearRange: [
      parseInt(searchParams.get('year_from') || '1993'),
      parseInt(searchParams.get('year_to') || '2026')
    ],
    priceRange: [
      parseFloat(searchParams.get('price_min') || '0'),
      parseFloat(searchParams.get('price_max') || '1000000')
    ]
  });
  const [sets, setSets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'price_desc');
  const [activeRarity, setActiveRarity] = useState(searchParams.get('rarity') || 'All');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [debouncedFilters, setDebouncedFilters] = useState<Partial<Filters>>(filters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'reference' | 'accessories'>(
    (searchParams.get('tab') as 'marketplace' | 'reference' | 'accessories') || 'marketplace'
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0); // Cart count state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const LIMIT = 50;

  const [hasAccessoriesExistInDb, setHasAccessoriesExistInDb] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccessories = async () => {
      try {
        const res = await fetchAccessories({ limit: 1 });
        setHasAccessoriesExistInDb(res.total_count > 0);
      } catch (err) {
        console.error("Failed to check if accessories exist", err);
        setHasAccessoriesExistInDb(false);
      }
    };
    checkAccessories();
  }, []);

  // Cart Count Logic
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const { items } = await fetchCart();
        const count = Array.isArray(items)
          ? items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
          : 0;
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
      setDebouncedQuery(query);
      setDebouncedFilters(filters);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, filters]);

  // Sync state with URL params
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    if (qParam !== query) setQuery(qParam);

    const gameParam = searchParams.get('game')?.split(',').filter(Boolean) || [];
    const setParam = searchParams.get('set')?.split(',').filter(Boolean) || [];
    const rarityParam = searchParams.get('rarity')?.split(',').filter(Boolean) || [];
    const catParam = searchParams.get('category')?.split(',').filter(Boolean) || [];
    const tabParam = (searchParams.get('tab') as any) || 'marketplace';

    // Only update if changed to avoid unnecessary re-renders
    if (JSON.stringify(filters.games) !== JSON.stringify(gameParam) ||
        JSON.stringify(filters.sets) !== JSON.stringify(setParam) ||
        JSON.stringify(filters.rarities) !== JSON.stringify(rarityParam) ||
        JSON.stringify(filters.categories) !== JSON.stringify(catParam)) {
      setFilters(prev => ({
        ...prev,
        games: gameParam,
        sets: setParam,
        rarities: rarityParam,
        categories: catParam
      }));
    }

    if (tabParam !== activeTab) setActiveTab(tabParam);
    
    const urlRarity = searchParams.get('rarity') || 'All';
    if (urlRarity !== activeRarity) setActiveRarity(urlRarity);

    const urlSort = searchParams.get('sort') || 'price_desc';
    if (urlSort !== sortBy) setSortBy(urlSort);
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const offset = page * LIMIT;

      try {
        let result: { cards: (CardProps & { card_id: string })[], total_count: number };

        if (activeTab === 'marketplace') {
          // Use the game code directly from filters.games
          const mappedGame = debouncedFilters.games?.[0] || undefined;

          const productRes = await fetchProducts({
            q: debouncedQuery || undefined,
            game: mappedGame,
            set: debouncedFilters.sets && debouncedFilters.sets.length > 0 ? debouncedFilters.sets.join(',') : undefined,
            rarity: activeRarity !== 'All' ? activeRarity : (debouncedFilters.rarities && debouncedFilters.rarities.length > 0 ? debouncedFilters.rarities.join(',') : undefined),
            color: debouncedFilters.colors && debouncedFilters.colors.length > 0 ? debouncedFilters.colors.map(c => colorCodeMap[c] || c) : undefined,
            type: debouncedFilters.types && debouncedFilters.types.length > 0 ? debouncedFilters.types : undefined,
            year_from: debouncedFilters.yearRange ? debouncedFilters.yearRange[0] : undefined,
            year_to: debouncedFilters.yearRange ? debouncedFilters.yearRange[1] : undefined,
            price_min: debouncedFilters.priceRange ? debouncedFilters.priceRange[0] : undefined,
            price_max: debouncedFilters.priceRange ? debouncedFilters.priceRange[1] : undefined,
            limit: LIMIT,
            offset,
            only_new: debouncedFilters.only_new,
            sort: sortBy
          }, controller.signal);

          result = {
            cards: productRes.products.map((p: any) => ({
              card_id: p.printing_id ? `${p.printing_id}-${p.finish || 'nonfoil'}` : p.id,
              name: p.name,
              set: p.set_code || 'Unknown',
              price: Number(p.price) || 0,
              image_url: p.image_url,
              rarity: p.rarity,
              total_stock: Number(p.stock) || 0,
              finish: p.finish,
              is_foil: p.finish === 'foil' || p.finish === 'etched',
              updated_at: p.updated_at
            })),
            total_count: productRes.total_count
          };
        } else if (activeTab === 'accessories') {
          // Use the game code directly
          const mappedGame = debouncedFilters.games?.[0] || undefined;

          const accRes = await fetchAccessories({
            q: debouncedQuery || undefined,
            game: mappedGame,
            category_code: searchParams.get('category') || (debouncedFilters.categories && debouncedFilters.categories.length > 0 ? debouncedFilters.categories[0] : undefined),
            price_min: debouncedFilters.priceRange ? debouncedFilters.priceRange[0] : undefined,
            price_max: debouncedFilters.priceRange ? debouncedFilters.priceRange[1] : undefined,
            sort: sortBy,
            limit: LIMIT,
            offset
          });

          result = {
            cards: accRes.accessories.map((a: any) => ({
              card_id: a.id,
              accessory_id: a.id,
              name: a.name,
              set: a.category, // Use category as "set" label
              price: Number(a.price) || 0,
              image_url: a.image_url,
              rarity: 'Common',
              total_stock: Number(a.stock) || 0,
              is_accessory: true,
              updated_at: a.updated_at
            })),
            total_count: accRes.total_count
          };
        } else {
          const cardRes = await fetchCards({
            q: debouncedQuery || undefined,
            rarity: activeRarity !== 'All' ? activeRarity : (debouncedFilters.rarities && debouncedFilters.rarities.length > 0 ? debouncedFilters.rarities.join(',') : undefined),
            game: debouncedFilters.games && debouncedFilters.games.length > 0 ? debouncedFilters.games.join(',') : undefined,
            set: debouncedFilters.sets && debouncedFilters.sets.length > 0 ? debouncedFilters.sets.join(',') : undefined,
            color: debouncedFilters.colors && debouncedFilters.colors.length > 0 ? debouncedFilters.colors.map(c => colorCodeMap[c] || c).join(',') : undefined,
            type: debouncedFilters.types && debouncedFilters.types.length > 0 ? debouncedFilters.types.join(',') : undefined,
            year_from: debouncedFilters.yearRange ? debouncedFilters.yearRange[0] : undefined,
            year_to: debouncedFilters.yearRange ? debouncedFilters.yearRange[1] : undefined,
            limit: LIMIT,
            offset,
            sort: sortBy
          }, controller.signal);

          result = {
            cards: cardRes.cards.map(c => ({
              ...c,
              card_id: (c as any).card_id
            })),
            total_count: cardRes.total_count
          };
        }

        if (offset === 0) {
          setCards(result.cards);
        } else {
          setCards(prev => {
            const existingIds = new Set(prev.map(c => (c as any).card_id));
            const newCards = result.cards.filter(c => !existingIds.has((c as any).card_id));
            return [...prev, ...newCards];
          });
        }
        setTotalCount(result.total_count);
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message === 'Fetch aborted') return;
        setError('Failed to fetch cards. Please try again later.');
        console.error(err);
      } finally {
        if (controller.signal.aborted) return;
        setLoading(false);
      }
    };

    fetchData();

    // Update URL Search Params - MERGE instead of overwrite
    const newParams = new URLSearchParams(searchParams);
    
    if (debouncedQuery) newParams.set('q', debouncedQuery);
    else newParams.delete('q');

    if (debouncedFilters.games && debouncedFilters.games.length > 0) {
      newParams.set('game', debouncedFilters.games.join(','));
    } else {
      newParams.delete('game');
    }

    if (debouncedFilters.sets && debouncedFilters.sets.length > 0) {
      newParams.set('set', debouncedFilters.sets.join(','));
    } else {
      newParams.delete('set');
    }

    if (activeRarity !== 'All') newParams.set('rarity', activeRarity);
    else newParams.delete('rarity');

    if (sortBy !== 'price_desc') newParams.set('sort', sortBy);
    else newParams.delete('sort');

    if (activeTab !== 'marketplace') newParams.set('tab', activeTab);
    else newParams.delete('tab');

    // Only update URL if it actually changed to prevent loops
    if (newParams.toString() !== searchParams.toString()) {
      setSearchParams(newParams, { replace: true });
    }

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, debouncedFilters, activeRarity, sortBy, page, activeTab, filters.only_new]);

  useEffect(() => {
    // Si no hay juegos seleccionados en filtros, usamos MTG por defecto
    const activeGameCode = filters.games && filters.games.length > 0 ? filters.games[0] : 'MTG';

    fetchSets(activeGameCode)
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

  const handleTabChange = (tab: 'marketplace' | 'reference' | 'accessories') => {
    setActiveTab(tab);
    setPage(0);
  };



  return (
    <div className="min-h-[100dvh] flex flex-col bg-geeko-black text-white font-sans relative selection:bg-geeko-cyan-neon/30">

      {/* Background Layer */}
      <div className="fixed inset-0 z-0 bg-geeko-black">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-geeko-cyan-neon/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-geeko-purple-vibrant/5 rounded-full blur-[100px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col">

        {/* Header */}
        <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

        {/* --- NEW HERO SECTION --- */}
        <section className="relative w-full pt-12 pb-20 overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8 text-center md:text-left z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-geeko-cyan-neon/10 border border-geeko-cyan-neon/20">
                <Sparkles size={14} className="text-geeko-cyan-neon animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-geeko-cyan-neon">Nuevo Inventario Disponible</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-web-titles font-black tracking-tighter leading-none uppercase italic">
                El Emporio <br />
                <span className="text-gradient-cyan">Mágico</span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-400 font-medium max-w-xl leading-relaxed">
                Descubre la colección más grande de cartas TCG en Latinoamérica. Precios de mercado con el respaldo de <span className="text-white font-bold">Geekorium</span>.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <button className="px-10 py-5 bg-geeko-cyan-neon text-black font-black uppercase tracking-widest rounded-xl neon-glow-cyan hover:scale-105 transition-all transform active:scale-95">
                  Ver Todo el Stock
                </button>
                <div className="flex items-center gap-3 text-neutral-500 font-bold uppercase text-xs tracking-widest">
                  <span className="w-8 h-px bg-neutral-800" />
                  Saber Más
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-geeko-cyan-neon/20 blur-[100px] rounded-full" />
              <img 
                src="/branding/Emporio.jpg" 
                alt="Geekorium Emporio" 
                className="relative z-10 w-full max-w-lg mx-auto rounded-[3rem] border-4 border-white/5 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700"
              />
            </div>
          </div>
        </section>

        {/* --- CATEGORY SELECTOR CIRCLES --- */}
        <section className="w-full pb-16">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex items-center justify-center gap-8 md:gap-16 overflow-x-auto py-4 no-scrollbar">
              {[
                { id: 'MTG', name: 'Magic', color: '#ff4444', icon: '🔥' },
                { id: 'PKM', name: 'Pokémon', color: '#ffcb05', icon: '⚡' },
                { id: 'OPC', name: 'One Piece', color: '#0070f3', icon: '⚓' },
                { id: 'DGM', name: 'Digimon', color: '#ff6b00', icon: '🦖' },
                { id: 'LOR', name: 'Lorcana', color: '#a020f0', icon: '✨' },
              ].map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => handleFilterChange({ ...filters, games: [cat.id] })}
                  className="group flex flex-col items-center gap-4 transition-all"
                >
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-geeko-surface border-2 border-white/5 flex items-center justify-center text-3xl transition-all group-hover:border-geeko-cyan-neon group-hover:neon-glow-cyan ${filters.games?.includes(cat.id) ? 'border-geeko-cyan-neon neon-glow-cyan' : ''}`}>
                    {cat.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${filters.games?.includes(cat.id) ? 'text-geeko-cyan-neon' : 'text-neutral-500 group-hover:text-white'}`}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>



        {/* Rarity Filter Tabs & Sort */}
        <div className="bg-[#0a0a0a]/95 border-b border-neutral-800 sticky top-[70px] z-40 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                <button
                  onClick={() => handleTabChange('marketplace')}
                  data-testid="inventory-tab"
                  className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'marketplace'
                    ? 'ring-2 ring-geeko-cyan-neon/30 bg-geeko-cyan-neon text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  <img src="/branding/Emporio.jpg" alt="Icon" className="w-5 h-5 rounded-full" />
                  Stock Geekorium
                </button>
                {isDevEnv && (
                  <>
                    <button
                      onClick={() => handleTabChange('reference')}
                      data-testid="reference-tab"
                      className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'reference'
                        ? 'ring-2 ring-blue-500/30 bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                        : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                      <Search size={16} className={activeTab === 'reference' ? 'text-white' : 'text-blue-500'} />
                      Mercado
                    </button>
                    <button
                      onClick={() => handleTabChange('accessories')}
                      data-testid="accessories-tab"
                      className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'accessories'
                        ? 'ring-2 ring-purple-500/30 bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                        : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                      <span className="text-purple-400">📦</span>
                      Catálogo
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {activeTab !== 'accessories' && (
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
                )}
              </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-neutral-400 flex items-center gap-2"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  {Object.values(filters).some(v => v && (typeof v === 'boolean' ? v : (v as any).length > 0)) && (
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
                    onClick={() => {
                      handleFilterChange({ ...filters, only_new: !filters.only_new });
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${filters.only_new ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    <Sparkles size={12} className={filters.only_new ? 'animate-pulse' : ''} />
                    Nuevo
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
        <main className="max-w-[1600px] w-full mx-auto px-6 py-8 flex-1">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar Filters */}
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto pr-2 custom-scrollbar">
                  <FiltersPanel
                    filters={{ ...mockFilters, sets }}
                    selected={filters}
                    onChange={handleFilterChange}
                    setsOptions={sets}
                    isAccessoryMode={activeTab === 'accessories'}
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
                  {activeTab === 'accessories' && cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="w-24 h-24 bg-neutral-900/50 rounded-3xl flex items-center justify-center mb-8 border border-white/5 relative group">
                        <div className="absolute inset-0 bg-geeko-cyan-neon/20 blur-2xl rounded-full group-hover:bg-geeko-cyan-neon/30 transition-all" />
                        {hasAccessoriesExistInDb ? (
                          <Search size={40} className="text-geeko-cyan-neon relative z-10" />
                        ) : (
                          <Sparkles size={40} className="text-geeko-cyan-neon relative z-10" />
                        )}
                      </div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 neon-text-cyan">
                        {hasAccessoriesExistInDb ? 'Sin Resultados' : 'Próximamente'}
                      </h3>
                      <p className="text-neutral-500 font-medium max-w-sm">
                        {hasAccessoriesExistInDb 
                          ? 'No encontramos accesorios que coincidan con tus filtros. ¡Intenta con otros!' 
                          : 'Estamos preparando la mejor selección de accesorios para tu colección. ¡Vuelve pronto!'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Active Filters Tokens */}
                      {(Object.values(filters).some(v => v && (typeof v === 'boolean' ? v : (v as any).length > 0)) || activeRarity !== 'All' || debouncedQuery) && (
                        <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mr-2">Activo:</span>

                          {debouncedQuery && (
                            <button onClick={() => { setQuery(''); setPage(0); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-geeko-cyan-neon/10 border border-geeko-cyan-neon/30 rounded-full text-[10px] font-bold text-geeko-cyan-neon hover:bg-geeko-cyan-neon/20 transition-all group">
                              Búsqueda: {debouncedQuery}
                              <X size={10} className="group-hover:rotate-90 transition-transform" />
                            </button>
                          )}

                          {filters.games?.map(g => (
                            <button key={g} data-testid="game-tab" data-active="true" onClick={() => handleFilterChange({ ...filters, games: filters.games?.filter(x => x !== g) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-geeko-purple-vibrant/10 border border-geeko-purple-vibrant/30 rounded-full text-[10px] font-bold text-geeko-purple-vibrant hover:bg-geeko-purple-vibrant/20 transition-all group">
                              {gameMap[g] || g}
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
                            <button key={c} onClick={() => handleFilterChange({ ...filters, colors: filters.colors?.filter(x => x !== c) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-geeko-cyan-neon/10 border border-geeko-cyan-neon/30 rounded-full text-[10px] font-bold text-geeko-cyan-neon hover:bg-geeko-cyan-neon/20 transition-all group">
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

                          {filters.categories?.map(c => (
                            <button key={c} onClick={() => handleFilterChange({ ...filters, categories: filters.categories?.filter(x => x !== c) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/10 border border-orange-500/30 rounded-full text-[10px] font-bold text-orange-400 hover:bg-orange-600/20 transition-all group">
                              {c}
                              <X size={10} className="group-hover:rotate-90 transition-transform" />
                            </button>
                          ))}

                          <button onClick={() => { setFilters({}); setQuery(''); setActiveRarity('All'); setPage(0); }} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors ml-2 underline underline-offset-4 decoration-neutral-800">
                            Limpiar Todo
                          </button>
                        </div>
                      )}

                      <CardGrid cards={cards} onCardClick={setSelectedCardId} viewMode={viewMode} isArchive={activeTab === 'reference'} showCartButton={true} />
                      {cards.length < totalCount && (
                        <div className="flex justify-center pb-20">
                          <button
                            onClick={() => setPage((p: number) => p + 1)}
                            disabled={loading}
                            className="group relative overflow-hidden px-12 py-5 bg-neutral-900 border border-neutral-800 rounded-full font-black text-[11px] tracking-[0.2em] uppercase hover:border-geeko-cyan-neon/50 transition-all flex items-center gap-4 disabled:opacity-50 shadow-2xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-geeko-cyan-neon/0 via-geeko-cyan-neon/10 to-geeko-cyan-neon/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              'Cargar Más Cartas'
                            )}
                            {!loading && <span className="text-neutral-600 bg-neutral-800 px-2 py-0.5 rounded-md">[{totalCount - cards.length}]</span>}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* --- NEW RIGHT SIDEBAR (Misiones) --- */}
            <aside className="hidden xl:block w-80 flex-shrink-0">
              <div className="sticky top-[140px] space-y-6">
                <div className="glass-sidebar rounded-3xl p-6 border border-white/5 space-y-8 neon-glow-cyan/5">
                  <div className="flex items-center gap-4">
                    <img src="/branding/Misiones.jpg" alt="Misiones" className="w-12 h-12 rounded-full border-2 border-geeko-cyan-neon/20" />
                    <div>
                      <h3 className="text-lg font-web-titles font-black uppercase tracking-tighter italic">Misiones</h3>
                      <p className="text-[10px] font-bold text-geeko-cyan-neon uppercase tracking-widest">En Progreso</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Explorar Stock</span>
                        <span className="text-geeko-cyan-neon">100%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-geeko-cyan-neon w-full neon-glow-cyan" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">¿Cómo completar?</h4>
                      <ul className="space-y-4">
                        {[
                          { step: '1', title: 'Selecciona', desc: 'Añade tus cartas al carrito.' },
                          { step: '2', title: 'Cotiza', desc: 'Verás el Market vs GK Price.' },
                          { step: '3', title: 'Asesoría', desc: 'Finaliza vía WhatsApp.' },
                        ].map(item => (
                          <li key={item.step} className="flex gap-3">
                            <span className="w-6 h-6 rounded bg-geeko-cyan-neon/10 border border-geeko-cyan-neon/20 flex items-center justify-center text-[10px] font-black text-geeko-cyan-neon shrink-0">{item.step}</span>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-tight">{item.title}</p>
                              <p className="text-[10px] text-neutral-500 font-medium">{item.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                       <a 
                    href="https://wa.me/your-number" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-geeko-cyan-neon hover:text-black transition-all"
                  >
                    Hablar con un Asesor
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <Footer />

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <CardModal
          isOpen={selectedCardId !== null}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
          onRequireAuth={() => setIsAuthModalOpen(true)}
          isArchive={activeTab === 'reference'}
        />

        {/* Mobile Filters Drawer */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-[#0a0a0a] border-l border-white/5 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black tracking-tighter">FILTROS</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-white/5 rounded-lg text-neutral-400">
                  <X size={20} />
                </button>
              </div>
              <FiltersPanel
                filters={{ ...mockFilters, sets }}
                selected={filters}
                onChange={handleFilterChange}
                setsOptions={sets}
                isAccessoryMode={activeTab === 'accessories'}
              />
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full mt-8 py-4 bg-geeko-cyan-neon text-black font-black text-xs uppercase tracking-widest rounded-xl"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;