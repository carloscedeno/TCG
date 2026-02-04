import React, { useEffect, useState } from 'react';
import { CardGrid } from '../components/Card/CardGrid';
import { CardModal } from '../components/Card/CardModal';
import type { CardProps } from '../components/Card/Card';
import { fetchCards, fetchSets, fetchProducts } from '../utils/api';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { FiltersPanel } from '../components/Filters/FiltersPanel';
import type { Filters } from '../components/Filters/FiltersPanel';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { UserMenu } from '../components/Navigation/UserMenu';
import { HeroSection } from '../components/Home/HeroSection';
import { LogIn, X, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartDrawer } from '../components/Navigation/CartDrawer';

const mockFilters: Filters = {
  games: ['Magic: The Gathering'],
  rarities: ['Common', 'Uncommon', 'Rare', 'Mythic'],
  colors: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'],
  types: ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'],
  sets: [],
  yearRange: [1993, 2026]
};

const Home: React.FC = () => {
  const [cards, setCards] = useState<(CardProps & { card_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [sets, setSets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('release_date');
  const [activeRarity, setActiveRarity] = useState('All');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'marketplace' | 'reference'>('reference');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const LIMIT = 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    // Reset page when filters change
    setPage(0);
  }, [debouncedQuery, filters, activeRarity, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const offset = page * LIMIT;

      try {
        let result: { cards: (CardProps & { card_id: string })[], total_count: number };

        if (activeTab === 'marketplace') {
          const productRes = await fetchProducts({
            q: debouncedQuery || undefined,
            game: filters.games && filters.games.length > 0 ? filters.games.join(',') : undefined,
            limit: LIMIT,
            offset,
            sort: sortBy === 'name' ? 'name' : (sortBy === 'price' ? 'price_desc' : 'newest')
          });

          result = {
            cards: productRes.products.map((p: any) => ({
              card_id: p.printing_id || p.id,
              name: p.name,
              set: p.set_code || 'Unknown',
              price: p.price || 0,
              image_url: p.image_url,
              rarity: p.rarity,
            })),
            total_count: productRes.total_count
          };
        } else {
          const cardRes = await fetchCards({
            q: debouncedQuery || undefined,
            rarity: activeRarity !== 'All' ? activeRarity : (filters.rarities && filters.rarities.length > 0 ? filters.rarities.join(',') : undefined),
            game: filters.games && filters.games.length > 0 ? filters.games.join(',') : undefined,
            set: filters.sets && filters.sets.length > 0 ? filters.sets.join(',') : undefined,
            color: filters.colors && filters.colors.length > 0 ? filters.colors.join(',') : undefined,
            type: filters.types && filters.types.length > 0 ? filters.types.join(',') : undefined,
            year_from: filters.yearRange ? filters.yearRange[0] : undefined,
            year_to: filters.yearRange ? filters.yearRange[1] : undefined,
            limit: LIMIT,
            offset,
            sort: sortBy === 'name' ? 'name' : 'release_date'
          });

          result = {
            cards: cardRes.cards.map(c => ({
              ...c,
              card_id: c.card_id
            })),
            total_count: cardRes.total_count
          };
        }

        if (offset === 0) {
          setCards(result.cards);
        } else {
          setCards(prev => [...prev, ...result.cards]);
        }
        setTotalCount(result.total_count);
      } catch (err: any) {
        setError('Failed to fetch cards. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        <header className="h-[70px] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl flex items-center">
          <nav className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-600/20">T</div>
                <h1 className="text-xl font-black tracking-tighter text-white">TCG HUB</h1>
              </div>
              <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-400">
                <a href="#" className="hover:text-white transition-colors">Home</a>
                <Link to="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
                <Link to="/profile" className="hover:text-white transition-colors">My Profile</Link>
              </div>
            </div>
            <div className="flex-1 max-w-xl mx-8 hidden lg:block">
              <SearchBar value={query} onChange={setQuery} placeholder="Search by card name or set..." />
            </div>
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <SearchBar value={query} onChange={setQuery} />
              </div>

              {/* Cart Button */}
              {user && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-neutral-400 hover:text-geeko-cyan group"
                >
                  <ShoppingCart size={20} />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-geeko-cyan rounded-full border-2 border-[#0a0a0a] group-hover:scale-150 transition-transform" />
                </button>
              )}

              {user ? (
                <UserMenu />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-full shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 flex items-center gap-2 text-xs"
                >
                  <LogIn size={14} /> <span className="hidden sm:inline">Iniciar Sesión</span>
                </button>
              )}
            </div>
          </nav>
        </header>

        {/* Page Title Section */}
        <div className="bg-[#121212]/50 border-b border-neutral-800">
          <div className="max-w-[1600px] mx-auto px-6 py-12">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-8">
              <span className="text-geeko-gold">New Arrivals</span>
              <span className="text-[10px]">▶</span>
              <span className="text-blue-500">Universes Beyond</span>
            </div>

            <div className="mb-16">
              <HeroSection />
            </div>

            {/* Mode switch moved to sticky bar for better visibility */}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                  TCG <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Price Tracker</span>
                </h1>
                <p className="text-neutral-500 text-lg max-w-2xl font-medium mb-10">
                  Showing <span className="text-neutral-300">{cards.length}</span> of <span className="text-neutral-300">{totalCount.toLocaleString()}</span> cards found in the database.
                </p>

                <div className="flex flex-wrap gap-4 md:gap-8 py-8 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-1">Vault Scale</span>
                    <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter">{(totalCount / 1000).toFixed(1)}K <span className="text-xs text-neutral-500 not-italic font-medium">Assets</span></span>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-white/5 self-center"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-1">Market Reach</span>
                    <span className="text-xl md:text-2xl font-black text-blue-500 italic tracking-tighter">04 <span className="text-xs text-neutral-500 not-italic font-medium">Nodes</span></span>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-white/5 self-center"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-1">Sync Latency</span>
                    <span className="text-xl md:text-2xl font-black text-emerald-500 italic tracking-tighter">99.9% <span className="text-xs text-neutral-500 not-italic font-medium">Uptime</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rarity Filter Tabs & Sort */}
        <div className="bg-[#0a0a0a]/95 border-b border-neutral-800 sticky top-[70px] z-40 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${activeTab === 'marketplace'
                    ? 'bg-geeko-cyan text-black shadow-lg shadow-geeko-cyan/20'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab('reference')}
                  className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${activeTab === 'reference'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  Archives
                </button>
              </div>

              <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
                {rarities.map(r => (
                  <button
                    key={r}
                    onClick={() => setActiveRarity(r)}
                    className={`px-3 md:px-6 py-2 rounded-full text-[9px] md:text-[11px] font-black tracking-widest uppercase transition-all ${activeRarity === r
                      ? 'bg-neutral-700 text-white shadow-lg'
                      : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    {r}
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
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filters</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-tighter text-neutral-500 hidden sm:inline">Order By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-neutral-900/50 text-white text-[11px] font-black uppercase px-4 md:px-6 py-2 rounded-full border border-neutral-800 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer hover:bg-neutral-800"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="release_date">Newest</option>
                  {activeTab === 'marketplace' && <option value="price">Price: Low to High</option>}
                </select>
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
              <div className="sticky top-[140px]">
                <FiltersPanel
                  filters={{ ...mockFilters, sets }}
                  selected={filters}
                  onChange={setFilters}
                  setsOptions={sets}
                />
              </div>
            </aside>

            {/* Cards Grid */}
            <div className="flex-1">
              {loading && page === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-neutral-500 font-black text-xs tracking-widest uppercase animate-pulse">Summoning Cards...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20 bg-red-900/5 border border-red-900/10 rounded-3xl">
                  <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="text-2xl text-red-500">!</div>
                  </div>
                  <h3 className="text-xl font-bold text-red-500 mb-2">Error Connection</h3>
                  <p className="text-neutral-500 text-sm max-w-md mx-auto">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-8 py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-500 transition-all shadow-lg shadow-red-600/20"
                  >
                    Reload Page
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Active Filters Tokens */}
                  {(Object.values(filters).some(v => v && v.length > 0) || activeRarity !== 'All' || debouncedQuery) && (
                    <div className="flex flex-wrap items-center gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mr-2">Active:</span>

                      {debouncedQuery && (
                        <button onClick={() => setQuery('')} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 border border-blue-500/30 rounded-full text-[10px] font-bold text-blue-400 hover:bg-blue-600/20 transition-all group">
                          Search: {debouncedQuery}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      )}

                      {filters.games?.map(g => (
                        <button key={g} onClick={() => setFilters({ ...filters, games: filters.games?.filter(x => x !== g) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/10 border border-purple-500/30 rounded-full text-[10px] font-bold text-purple-400 hover:bg-purple-600/20 transition-all group">
                          {g}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      {filters.sets?.map(s => (
                        <button key={s} onClick={() => setFilters({ ...filters, sets: filters.sets?.filter(x => x !== s) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-400 hover:bg-emerald-600/20 transition-all group">
                          Set: {s}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      {filters.colors?.map(c => (
                        <button key={c} onClick={() => setFilters({ ...filters, colors: filters.colors?.filter(x => x !== c) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/10 border border-cyan-500/30 rounded-full text-[10px] font-bold text-cyan-400 hover:bg-cyan-600/20 transition-all group">
                          {c}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      {filters.types?.map(t => (
                        <button key={t} onClick={() => setFilters({ ...filters, types: filters.types?.filter(x => x !== t) })} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 hover:bg-red-600/20 transition-all group">
                          {t}
                          <X size={10} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      ))}

                      <button onClick={() => { setFilters({}); setQuery(''); setActiveRarity('All'); }} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors ml-2 underline underline-offset-4 decoration-neutral-800">
                        Clear All
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
                          'Load More Archives'
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

        {/* Footer */}
        <footer className="border-t border-neutral-800 bg-[#121212] py-20 mt-20">
          <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 items-center gap-12 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center font-bold text-sm italic">T</div>
              <span className="text-lg font-black tracking-tighter uppercase italic">TCG HUB</span>
            </div>
            <div className="text-neutral-500 text-xs font-medium text-center">
              © 2026 TCG Price Tracker. Advanced Data Analytics Platform.
            </div>
            <div className="flex gap-8 text-neutral-500 text-xs font-bold uppercase tracking-widest justify-center md:justify-end">
              <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-500 transition-colors">API docs</a>
            </div>
          </div>
        </footer>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <CardModal
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
          cardId={selectedCardId}
        />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

        {/* Mobile Filters Drawer */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileFiltersOpen(false)} />
            <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-[#0a0a0a] border-l border-white/5 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black italic tracking-tighter">FILTERS</h2>
                <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 bg-white/5 rounded-lg text-neutral-400">
                  <X size={20} />
                </button>
              </div>
              <FiltersPanel
                filters={{ ...mockFilters, sets }}
                selected={filters}
                onChange={setFilters}
                setsOptions={sets}
              />
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="w-full mt-8 py-4 bg-geeko-cyan text-black font-black text-xs uppercase tracking-widest rounded-xl"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;