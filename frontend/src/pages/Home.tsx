import React, { useEffect, useState } from 'react';
import { CardGrid } from '../components/Card/CardGrid';
import { CardModal } from '../components/Card/CardModal';
import type { CardProps } from '../components/Card/Card';
import { fetchCards, fetchSets } from '../utils/api';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { FiltersPanel } from '../components/Filters/FiltersPanel';
import type { Filters } from '../components/Filters/FiltersPanel';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/Auth/AuthModal';
import { LogIn, LayoutDashboard, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const mockFilters: Omit<Filters, 'sets'> = {
  games: ['Magic: The Gathering', 'Pokémon', 'Yu-Gi-Oh!', 'Lorcana'],
  rarities: ['Common', 'Uncommon', 'Rare', 'Mythic'],
  colors: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'],
};

const Home: React.FC = () => {
  const [cards, setCards] = useState<(CardProps & { card_id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [sets, setSets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [activeRarity, setActiveRarity] = useState('All');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const { user, isAdmin, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const LIMIT = 50;

  useEffect(() => {
    // Reset page when filters change
    setPage(0);
  }, [query, filters, activeRarity]);

  useEffect(() => {
    setLoading(true);
    // Use activeRarity tab if not 'All'
    const rarityToFilter = activeRarity !== 'All' ? activeRarity : (filters.rarities && filters.rarities.length > 0 ? filters.rarities.join(',') : null);

    fetchCards({
      q: query || undefined,
      rarity: rarityToFilter || undefined,
      game: filters.games && filters.games.length > 0 ? filters.games.join(',') : undefined,
      set: filters.sets && filters.sets.length > 0 ? filters.sets.join(',') : undefined,
      color: filters.colors && filters.colors.length > 0 ? filters.colors.join(',') : undefined,
      limit: LIMIT,
      offset: page * LIMIT
    })
      .then(({ cards: fetchedCards, total_count }) => {
        setTotalCount(total_count);
        // Sort cards in frontend for now
        const sorted = [...fetchedCards].sort((a, b) => {
          if (sortBy === 'price') return b.price - a.price;
          return a.name.localeCompare(b.name);
        });

        if (page === 0) {
          setCards(sorted);
        } else {
          setCards(prev => [...prev, ...sorted]);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query, filters, activeRarity, sortBy, page]);

  useEffect(() => {
    fetchSets('MTG')
      .then(realSets => setSets(realSets.map((s: any) => s.set_name)))
      .catch(() => setSets([]));
  }, []);

  const rarities = ['All', 'Mythic', 'Rare', 'Uncommon', 'Common'];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-cyan-500/30 overflow-hidden">

      {/* Ambient Background Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">

        {/* Header */}
        <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl shadow-black/50">
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
                {isAdmin && (
                  <Link to="/admin" className="text-blue-400 font-bold hover:text-blue-300 transition-colors flex items-center gap-1">
                    <LayoutDashboard size={14} /> Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex-1 max-w-xl mx-8 hidden md:block">
              <SearchBar value={query} onChange={setQuery} />
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="group relative">
                  <button className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full hover:border-neutral-700 transition-all">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-neutral-300 hidden sm:block">{user.email?.split('@')[0]}</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 hidden group-hover:block w-48 animate-in fade-in slide-in-from-top-1">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-2xl">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <LogOut size={14} /> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-full shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 flex items-center gap-2 text-xs"
                >
                  <LogIn size={14} /> Iniciar Sesión
                </button>
              )}
              <div className="md:hidden">
                <SearchBar value={query} onChange={setQuery} />
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="relative group rounded-3xl overflow-hidden cursor-pointer border border-white/10" onClick={() => {
                setFilters({ ...filters, sets: ["Marvel's Spider-Man"] });
                setQuery('');
              }}>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-blue-700 opacity-80 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative p-8 flex flex-col justify-end h-48">
                  <h3 className="text-3xl font-black italic uppercase text-white mb-2">Marvel x Magic</h3>
                  <p className="text-sm font-medium text-white/80">Spiderman, Captain America & more available now.</p>
                </div>
              </div>

              <div className="relative group rounded-3xl overflow-hidden cursor-pointer border border-white/10" onClick={() => {
                setFilters({ ...filters, sets: ['Avatar: The Last Airbender'] });
                setQuery('');
              }}>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-orange-400 opacity-80 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="relative p-8 flex flex-col justify-end h-48">
                  <h3 className="text-3xl font-black italic uppercase text-white mb-2">Avatar: The Last Airbender</h3>
                  <p className="text-sm font-medium text-white/80">Master the four elements with Aang and friends.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                  TCG <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Price Tracker</span>
                </h1>
                <p className="text-neutral-500 text-lg max-w-2xl font-medium">
                  Showing <span className="text-neutral-300">{cards.length}</span> of <span className="text-neutral-300">{totalCount.toLocaleString()}</span> cards found in the database.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rarity Filter Tabs & Sort */}
        <div className="bg-[#0a0a0a] border-b border-neutral-800 sticky top-[65px] z-40 backdrop-blur-md bg-opacity-80">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex bg-neutral-900/50 p-1 rounded-full border border-neutral-800">
              {rarities.map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRarity(r)}
                  className={`px-6 py-2 rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${activeRarity === r
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-tighter text-neutral-500">Order By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-neutral-900/50 text-white text-xs font-bold px-4 py-2 rounded-full border border-neutral-800 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price">Price (High to Low)</option>
                </select>
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
                <div className="flex flex-col gap-12">
                  <CardGrid cards={cards} onCardClick={setSelectedCardId} />
                  {cards.length < totalCount && (
                    <div className="flex justify-center pb-20">
                      <button
                        onClick={() => setPage((p: number) => p + 1)}
                        disabled={loading}
                        className="px-10 py-4 bg-neutral-900 border border-neutral-800 rounded-full font-black text-[11px] tracking-widest uppercase hover:bg-neutral-800 hover:border-neutral-700 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
                      >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'More Results'
                        )}
                        {!loading && <span className="text-neutral-500">[{totalCount - cards.length}]</span>}
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
      </div>
    </div>
  );
};

export default Home;