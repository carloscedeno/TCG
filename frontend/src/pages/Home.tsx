import React, { useEffect, useState } from 'react';

import { CardGrid } from '../components/Card/CardGrid';
import type { CardProps } from '../components/Card/Card';
import { fetchCards, fetchSets, fetchProducts, fetchCart, fetchAccessories, fetchDiscountedSingles, fetchDiscountedAccessories, checkGameInventoryPresence } from '../utils/api';
import { FiltersPanel } from '../components/Filters/FiltersPanel';
import type { Filters } from '../components/Filters/FiltersPanel';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { X, Sparkles, Search } from 'lucide-react';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { Footer } from '../components/Navigation/Footer';
import { Header } from '../components/Navigation/Header';
import { HeroSection } from '../components/Home/HeroSection';
import { PresaleSection } from '../components/Home/PresaleSection';
import { DealsCarousel } from '../components/Home/DealsCarousel';


const mockFilters: Filters = {
  games: ['MTG', 'PKM', 'YGO', 'FAB', 'OPC', 'DGM', 'WXS', 'LOR'],
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
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
      searchParams.has('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined,
      searchParams.has('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined
    ],
    only_new: searchParams.get('only_new') === 'true'
  });
  const [sets, setSets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'price_desc');

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [debouncedFilters, setDebouncedFilters] = useState<Partial<Filters>>(filters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'catalog'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'catalog' || tabParam === 'marketplace') return tabParam;
    
    return 'marketplace';
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const LIMIT = 50;


  const [inventoryPresence, setInventoryPresence] = useState({ hasSingles: true, hasCatalog: true });
  const [discountedSingles, setDiscountedSingles] = useState<(CardProps & { card_id: string })[]>([]);
  const [discountedAccessories, setDiscountedAccessories] = useState<(CardProps & { card_id: string })[]>([]);

  useEffect(() => {
    const gameCode = filters.games && filters.games.length > 0 ? filters.games[0] : undefined;

    const checkInventory = async () => {
      const presence = await checkGameInventoryPresence(gameCode);
      setInventoryPresence(presence);
      
      if (!presence.hasSingles && presence.hasCatalog && activeTab === 'marketplace') {
         setActiveTab('catalog');
         const params = new URLSearchParams(searchParams);
         params.set('tab', 'catalog');
         setSearchParams(params);
      } else if (presence.hasSingles && !presence.hasCatalog && activeTab === 'catalog') {
         setActiveTab('marketplace');
         const params = new URLSearchParams(searchParams);
         params.set('tab', 'marketplace');
         setSearchParams(params);
      }
    };
    checkInventory();
  }, [filters.games]);


  const isDefaultFilter = (key: string, val: any) => {
    if (key === 'yearRange') return (val as any)[0] <= 1993 && (val as any)[1] >= 2026;
    if (key === 'priceRange') return (val as any)[0] === undefined && (val as any)[1] === undefined;
    if (Array.isArray(val)) return val.length === 0;
    return !val;
  };

  const showHeroSection = !query && (
    activeTab === 'catalog' ||
    Object.entries(filters).every(([key, val]) => {
      if (key === 'games') return Array.isArray(val) && val.length <= 1;
      return isDefaultFilter(key, val);
    })
  );

  const isDashboardView = !query && Object.entries(filters).every(([key, val]) => isDefaultFilter(key, val)) && (activeTab as string) !== 'catalog';
  const isAccessoryTab = activeTab === 'catalog' && (!filters.games?.length || filters.games.includes('ACCESSORIES') || filters.games.includes('OTHERS'));

  useEffect(() => {
    const gameCode = filters.games && filters.games.length > 0 ? filters.games[0] : undefined;
    
    if (isDashboardView) {
      const loadDeals = async () => {
        const [singles, accessories] = await Promise.all([
          fetchDiscountedSingles(gameCode),
          fetchDiscountedAccessories(gameCode)
        ]);
        setDiscountedSingles(singles);
        setDiscountedAccessories(accessories);
      };
      loadDeals();
    }
  }, [filters.games, query, filters, isDashboardView]);

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
  }, [user]);

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
    const colorParam = searchParams.get('color')?.split(',').filter(Boolean) || [];
    const typeParam = searchParams.get('type')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.has('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined;
    const maxPrice = searchParams.has('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined;
    const minYear = searchParams.has('year_from') ? parseInt(searchParams.get('year_from')!) : 1993;
    const maxYear = searchParams.has('year_to') ? parseInt(searchParams.get('year_to')!) : 2026;
    const onlyNew = searchParams.get('only_new') === 'true';
    const onlyDiscount = searchParams.get('only_discount') === 'true';
    const onlyPresale = searchParams.get('only_presale') === 'true';
    const tabParam = (searchParams.get('tab') as any) || 'marketplace';

    const newPriceRange: [number | undefined, number | undefined] = [minPrice, maxPrice];
    const newYearRange: [number, number] = [minYear, maxYear];

    if (JSON.stringify(filters.games) !== JSON.stringify(gameParam) ||
        JSON.stringify(filters.sets) !== JSON.stringify(setParam) ||
        JSON.stringify(filters.rarities) !== JSON.stringify(rarityParam) ||
        JSON.stringify(filters.categories) !== JSON.stringify(catParam) ||
        JSON.stringify(filters.colors) !== JSON.stringify(colorParam) ||
        JSON.stringify(filters.types) !== JSON.stringify(typeParam) ||
        JSON.stringify(filters.priceRange) !== JSON.stringify(newPriceRange) ||
        JSON.stringify(filters.yearRange) !== JSON.stringify(newYearRange) ||
        filters.only_new !== onlyNew ||
        filters.only_discount !== onlyDiscount ||
        filters.only_presale !== onlyPresale) {
      setFilters(prev => ({
        ...prev,
        games: gameParam,
        sets: setParam,
        rarities: rarityParam,
        categories: catParam,
        colors: colorParam,
        types: typeParam,
        priceRange: newPriceRange,
        yearRange: newYearRange,
        only_new: onlyNew,
        only_discount: onlyDiscount,
        only_presale: onlyPresale
      }));
    }

    if (tabParam !== activeTab) setActiveTab(tabParam);
    


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
          const mappedGame = debouncedFilters.games?.[0] || undefined;

          const productRes = await fetchProducts({
            q: debouncedQuery || undefined,
            game: mappedGame,
            set: debouncedFilters.sets && debouncedFilters.sets.length > 0 ? debouncedFilters.sets.join(',') : undefined,
            rarity: (debouncedFilters.rarities && debouncedFilters.rarities.length > 0 ? debouncedFilters.rarities.join(',') : undefined),
            color: debouncedFilters.colors && debouncedFilters.colors.length > 0 ? debouncedFilters.colors.map(c => colorCodeMap[c] || c) : undefined,
            type: debouncedFilters.types && debouncedFilters.types.length > 0 ? debouncedFilters.types : undefined,
            year_from: debouncedFilters.yearRange ? debouncedFilters.yearRange[0] : undefined,
            year_to: debouncedFilters.yearRange ? debouncedFilters.yearRange[1] : undefined,
            price_min: debouncedFilters.priceRange ? debouncedFilters.priceRange[0] : undefined,
            price_max: debouncedFilters.priceRange ? debouncedFilters.priceRange[1] : undefined,
            only_new: debouncedFilters.only_new,
            only_discount: debouncedFilters.only_discount,
            only_presale: debouncedFilters.only_presale,
            limit: LIMIT,
            offset,
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
              type: p.type_line,
              total_stock: Number(p.stock) || 0,
              finish: p.finish,
              is_foil: p.finish === 'foil' || p.finish === 'etched',
              original_price: p.original_price,
              discount_percentage: p.discount_percentage,
              updated_at: p.updated_at
            })),
            total_count: productRes.total_count
          };
        } else if (activeTab === 'catalog') {
          const mappedGame = debouncedFilters.games?.[0] || undefined;

          const accRes = await fetchAccessories({
            q: debouncedQuery || undefined,
            game: mappedGame,
            category_code: searchParams.get('category') || (debouncedFilters.categories && debouncedFilters.categories.length > 0 ? debouncedFilters.categories[0] : undefined),
            price_min: debouncedFilters.priceRange ? debouncedFilters.priceRange[0] : undefined,
            price_max: debouncedFilters.priceRange ? debouncedFilters.priceRange[1] : undefined,
            only_discount: debouncedFilters.only_discount,
            only_presale: debouncedFilters.only_presale,
            sort: sortBy,
            limit: LIMIT,
            offset
          });

          result = {
            cards: accRes.accessories.map((a: any) => ({
              card_id: a.id,
              accessory_id: a.id,
              name: a.name,
              set: a.category, 
              price: Number(a.price) || 0,
              original_price: Number(a.original_price) || Number(a.price) || 0,
              discount_percentage: Number(a.discount_percentage) || 0,
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
            rarity: (debouncedFilters.rarities && debouncedFilters.rarities.length > 0 ? debouncedFilters.rarities.join(',') : undefined),
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
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, debouncedFilters, sortBy, page, activeTab]);

  useEffect(() => {
    const activeGameCode = filters.games && filters.games.length > 0 ? filters.games[0] : 'MTG';

    fetchSets(activeGameCode)
      .then(realSets => {
        const setNames = realSets.map((s: any) => s.set_name);
        setSets(setNames);
      })
      .catch(() => setSets([]));
  }, [filters.games]);



  const updateURL = (params: Record<string, string | string[] | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        newParams.delete(key);
      } else {
        newParams.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    });
    setSearchParams(newParams);
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    updateURL({
      game: newFilters.games,
      set: newFilters.sets,
      rarity: newFilters.rarities,
      category: newFilters.categories,
      color: newFilters.colors,
      type: newFilters.types,
      price_min: newFilters.priceRange?.[0]?.toString(),
      price_max: newFilters.priceRange?.[1]?.toString(),
      only_discount: newFilters.only_discount ? 'true' : undefined,
      only_presale: newFilters.only_presale ? 'true' : undefined,
      only_new: newFilters.only_new ? 'true' : undefined
    });
    setPage(0);
  };



  const handleTabChange = (tab: 'marketplace' | 'catalog') => {
    updateURL({ tab });
    setPage(0);
  };

  const handleCardClick = (id: string, isArchive: boolean = false) => {
    if (isArchive) {
      navigate(`/product/${id}?archive=true`);
    } else {
      navigate(`/card/${id}`);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-geeko-black text-text-high font-sans relative selection:bg-white/30">

      {/* Background Layer */}
      <div className="fixed inset-0 z-0 bg-geeko-black">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-geeko-purple-vibrant/5 rounded-full blur-[100px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col">

        {/* Header */}
        <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

        {showHeroSection && (
          <div className="max-w-[1600px] mx-auto w-full px-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-1000">
            <HeroSection gameCode={filters.games && filters.games.length === 1 ? filters.games[0] : undefined} />
            {(isDashboardView || (activeTab === 'catalog' && (!filters.games || filters.games.length === 0))) && <PresaleSection />}
          </div>
        )}




        {/* SINGLES Header (Production Style) */}
        {activeTab === 'marketplace' && filters.games?.includes('MTG') && (
          <div className="max-w-[1600px] mx-auto px-6 pt-6 flex items-center gap-2">
            <Sparkles size={18} className="text-geeko-cyan fill-current" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-text-high">SINGLES</span>
          </div>
        )}

        {/* Rarity Filter Tabs & Sort */}
        <div className="bg-[#0a0a0a]/95 border-b border-neutral-800 sticky top-[60px] z-40 backdrop-blur-md">
            <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                  {inventoryPresence.hasSingles && (
                  <button
                    onClick={() => handleTabChange('marketplace')}
                    data-testid="inventory-tab"
                    className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'marketplace'
                      ? 'ring-2 ring-geeko-cyan/30 bg-geeko-cyan text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                      : 'text-text-low hover:text-neutral-300'
                      }`}
                  >
                    <img src="/branding/Emporio.jpg" alt="Icon" className="w-5 h-5 rounded-full" />
                    Stock Geekorium
                  </button>
                )}
                
                {inventoryPresence.hasCatalog && (
                  <button
                    onClick={() => handleTabChange('catalog')}
                    data-testid="archives-tab"
                    className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'catalog'
                      ? 'ring-2 ring-geeko-cyan/30 bg-geeko-cyan text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                      : 'text-text-low hover:text-neutral-300'
                      }`}
                  >
                    <Search size={16} className={activeTab === 'catalog' ? 'text-black' : 'text-geeko-cyan'} />
                    Catálogo
                  </button>
                )}
              </div>


            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-text-low flex items-center gap-2"
              >
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  {Object.values(filters).some(v => v && (typeof v === 'boolean' ? v : (v as any).length > 0)) && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filtros</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-tighter text-text-low hidden sm:inline">Ordenar:</span>
                <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                  <button
                    onClick={() => updateURL({ sort: sortBy === 'name' ? 'name_desc' : 'name' })}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${sortBy.includes('name') ? 'bg-neutral-700 text-text-high' : 'text-text-low hover:text-neutral-300'}`}
                  >
                    Nombre {sortBy === 'name' ? '↓' : (sortBy === 'name_desc' ? '↑' : '⇅')}
                  </button>
                  <button
                    onClick={() => updateURL({ sort: sortBy === 'price_asc' ? 'price_desc' : 'price_asc' })}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${sortBy.includes('price') ? 'bg-neutral-700 text-text-high' : 'text-text-low hover:text-neutral-300'}`}
                  >
                    Precio {sortBy === 'price_asc' ? '↑' : (sortBy === 'price_desc' ? '↓' : '⇅')}
                  </button>
                </div>
                
                <button
                  onClick={() => updateURL({ only_new: filters.only_new ? undefined : 'true' })}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                    filters.only_new
                      ? 'bg-geeko-purple-vibrant text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/50'
                      : 'bg-neutral-900/50 text-text-low hover:text-neutral-300 border border-neutral-800'
                  }`}
                >
                  <Sparkles size={12} className={filters.only_new ? 'text-white' : 'text-geeko-purple-vibrant'} />
                  Nuevo
                </button>
              </div>

              <div className="flex bg-neutral-900/50 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-neutral-800 text-text-high shadow-inner' : 'text-text-low hover:text-neutral-300'}`}
                  title="Grid View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-neutral-800 text-text-high shadow-inner' : 'text-text-low hover:text-neutral-300'}`}
                  title="List View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-[1600px] w-full mx-auto px-6 py-4 flex-1">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-[130px] max-h-[calc(100vh-150px)] overflow-y-auto pr-2 custom-scrollbar">
                <FiltersPanel
                  filters={{ ...mockFilters, sets }}
                  selected={filters}
                  onChange={handleFilterChange}
                  setsOptions={sets}
                  isAccessoryMode={isAccessoryTab}
                />
              </div>
            </aside>

            {/* Cards Grid / Deals Dashboard */}
            <div className="flex-1">
              {isDashboardView && activeTab === 'marketplace' && (discountedSingles.length > 0 || discountedAccessories.length > 0) && (
                // DEALS DASHBOARD (Only for marketplace home when deals exist)
                <div className="flex flex-col gap-6 w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {inventoryPresence.hasSingles && discountedSingles.length > 0 && (
                    <DealsCarousel title="Hechizos en Descuento" cards={discountedSingles} onCardClick={(id) => handleCardClick(id, false)} />
                  )}
                  {inventoryPresence.hasCatalog && discountedAccessories.length > 0 && (
                    <DealsCarousel title="Artilugios en Descuento" cards={discountedAccessories} onCardClick={(id) => handleCardClick(id, false)} isArchive={false} />
                  )}
                </div>
              )}

              {loading && page === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <p className="text-text-low font-black text-xs tracking-widest uppercase animate-pulse">Invocando Cartas...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-red-900/5 border border-red-900/10 rounded-3xl">
                  <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="text-2xl text-red-500">!</div>
                  </div>
                  <h3 className="text-xl font-bold text-red-500 mb-2">Error de Conexión</h3>
                  <p className="text-text-low text-sm max-w-md mx-auto">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-8 py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-600/20"
                  >
                    Recargar Página
                  </button>
                </div>
              ) : isDashboardView && activeTab === 'marketplace' ? (
                discountedSingles.length === 0 && discountedAccessories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-24 h-24 bg-neutral-900/50 rounded-3xl flex items-center justify-center mb-8 border border-white/5">
                      <Sparkles size={40} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">Sin Ofertas por Ahora</h3>
                    <p className="text-text-low font-medium max-w-sm">No hay descuentos activos en este momento. Usa los filtros o busca para explorar el catálogo completo.</p>
                  </div>
                ) : null
              ) : (
                <div className="flex flex-col gap-6">
                  {activeTab === 'catalog' && cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="w-24 h-24 bg-neutral-900/50 rounded-3xl flex items-center justify-center mb-8 border border-white/5 relative group">
                        <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full group-hover:bg-white/30 transition-all" />
                        {inventoryPresence.hasCatalog ? (
                          <Search size={40} className="text-white relative z-10" />
                        ) : (
                          <Sparkles size={40} className="text-white relative z-10" />
                        )}
                      </div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">
                        {inventoryPresence.hasCatalog ? 'Sin Resultados' : 'Próximamente'}
                      </h3>
                      <p className="text-text-low font-medium max-w-sm">
                        {inventoryPresence.hasCatalog 
                          ? 'No encontramos accesorios que coincidan con tus filtros. ¡Intenta con otros!' 
                          : 'Estamos preparando la mejor selección de accesorios para tu colección. ¡Vuelve pronto!'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <CardGrid cards={cards} onCardClick={(id) => handleCardClick(id, false)} viewMode={viewMode} isArchive={false} showCartButton={true} />
                      {cards.length < totalCount && (
                        <div className="flex justify-center pb-20">
                          <button
                            onClick={() => setPage((p: number) => p + 1)}
                            disabled={loading}
                            className="group relative overflow-hidden px-12 py-5 bg-neutral-900 border border-neutral-800 rounded-full font-black text-[11px] tracking-[0.2em] uppercase hover:border-white/50 transition-all flex items-center gap-4 disabled:opacity-50 shadow-2xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            {loading ? (
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              'Cargar Más Cartas'
                            )}
                            {!loading && <span className="text-text-low bg-neutral-800 px-2 py-0.5 rounded-md">[{totalCount - cards.length}]</span>}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            </div>
        </main>


        {/* Footer */}
        <Footer />

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Mobile Filters Drawer */}
        {
          isMobileFiltersOpen && (
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
                  isAccessoryMode={isAccessoryTab}
                />
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full mt-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          )
        }
      </div>
    </div>
  );
};

export default Home;