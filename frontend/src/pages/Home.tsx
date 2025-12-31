import React, { useEffect, useState } from 'react';
import { CardGrid } from '../components/Card/CardGrid';
import type { CardProps } from '../components/Card/Card';
import { fetchCards, fetchSets } from '../utils/api';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { FiltersPanel } from '../components/Filters/FiltersPanel';
import type { Filters } from '../components/Filters/FiltersPanel';

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
      .then(realSets => setSets(realSets.map(s => s.set_name)))
      .catch(() => setSets([]));
  }, []);

  const rarities = ['All', 'Mythic', 'Rare', 'Uncommon', 'Common'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Moxfield-style Header */}
      <header className="bg-[#121212] border-b border-neutral-800 sticky top-0 z-50 shadow-xl">
        <nav className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">G</div>
              <h1 className="text-xl font-black tracking-tighter text-white">GEEKORIUM</h1>
            </div>
            <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-400">
              <a href="#" className="hover:text-white transition-colors">Home</a>
              <a href="#" className="hover:text-white transition-colors flex items-center gap-1">Explore <span className="text-[10px]">▼</span></a>
              <a href="#" className="hover:text-white transition-colors">Moxie</a>
              <a href="#" className="hover:text-white transition-colors">Help</a>
              <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>
              <a href="#" className="hover:text-white transition-colors">Your Decks</a>
              <a href="#" className="hover:text-white transition-colors">Collection</a>
              <a href="#" className="hover:text-white transition-colors">Wish List</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar value={query} onChange={setQuery} />
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 border border-neutral-700"></div>
            </div>
          </div>
        </nav>
      </header>

      {/* Page Title Section */}
      <div className="bg-[#121212]/50 border-b border-neutral-800">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
            <span>Sets</span>
            <span className="text-[10px]">▶</span>
            <span className="text-purple-500">All Cards</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight">
                TCG Price Aggregator
              </h2>
              <p className="text-neutral-500 text-sm mt-2 font-medium">
                Showing <span className="text-neutral-300">{cards.length}</span> of <span className="text-neutral-300">{totalCount.toLocaleString()}</span> cards found in the database • Updated real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rarity Filter Tabs & Sort */}
      <div className="bg-[#0a0a0a] border-b border-neutral-800 sticky top-[65px] z-40 backdrop-blur-md bg-opacity-80">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            {rarities.map(r => (
              <button
                key={r}
                onClick={() => setActiveRarity(r)}
                className={`px-5 py-1.5 rounded-md text-xs font-bold transition-all ${activeRarity === r
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-neutral-500 hover:text-neutral-300'
                  }`}
              >
                {r === 'All' ? 'All' : r + 's'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-900 text-white text-xs font-bold px-4 py-2 rounded-lg border border-neutral-800 focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option value="name">Name (A-Z)</option>
                <option value="price">Price (High to Low)</option>
              </select>
            </div>
            <div className="flex gap-1">
              <button className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              </button>
              <button className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-12 h-12 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-neutral-500 font-bold text-sm animate-pulse">Summoning cards...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-red-900/10 border border-red-900/20 rounded-2xl">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-500 mb-2">Error fetching cards</h3>
                <p className="text-neutral-500 text-sm">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                <CardGrid cards={cards} />
                {cards.length < totalCount && (
                  <div className="flex justify-center pb-10">
                    <button
                      onClick={() => setPage((p: number) => p + 1)}
                      disabled={loading}
                      className="px-8 py-3 bg-neutral-900 border border-neutral-800 rounded-xl font-bold text-sm hover:bg-neutral-800 hover:border-neutral-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Load More Cards'}
                      {!loading && <span className="text-neutral-500">({totalCount - cards.length} remaining)</span>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-[#121212] py-12 mt-20">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-neutral-700 rounded flex items-center justify-center font-bold text-sm">G</div>
            <span className="text-sm font-black tracking-tighter">GEEKORIUM</span>
          </div>
          <div className="text-neutral-500 text-xs font-medium">
            © 2025 Geekorium TCG. All rights reserved. Data provided by Scryfall.
          </div>
          <div className="flex gap-6 text-neutral-500 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;