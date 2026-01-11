import React, { useState, useMemo } from 'react';
import { Search, X, Sliders, Filter, Check } from 'lucide-react';

export interface Filters {
  games: string[];
  sets: string[];
  rarities: string[];
  colors: string[];
}

export interface FiltersPanelProps {
  filters: Filters;
  selected: Partial<Filters>;
  onChange: (selected: Partial<Filters>) => void;
  setsOptions: string[];
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, selected, onChange, setsOptions }) => {
  const [setSearch, setSetSearch] = useState('');

  const filteredSets = useMemo(() => {
    if (!setSearch) return setsOptions.slice(0, 50); // Muestra solo los primeros 50 por defecto
    return setsOptions.filter(s => s.toLowerCase().includes(setSearch.toLowerCase())).slice(0, 50);
  }, [setsOptions, setSearch]);

  const handleCheckbox = (key: keyof Filters, value: string) => {
    const prev = selected[key] || [];
    if (prev.includes(value)) {
      onChange({ ...selected, [key]: prev.filter((v: string) => v !== value) });
    } else {
      onChange({ ...selected, [key]: [...prev, value] });
    }
  };

  const clearFilters = () => {
    onChange({});
    setSetSearch('');
  };

  const hasActiveFilters = Object.values(selected).some(v => v && v.length > 0);

  return (
    <aside className="w-full bg-[#0d0d0d] border border-white/5 p-6 rounded-3xl shadow-2xl space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black italic tracking-tighter text-white flex items-center gap-2">
          <Sliders size={18} className="text-blue-500" />
          FILTERS
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 group"
          >
            <X size={10} className="group-hover:rotate-90 transition-transform" />
            Reset
          </button>
        )}
      </div>

      {/* Juegos */}
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
          Game Universe
        </h3>
        <div className="flex flex-wrap gap-2">
          {filters.games.map(game => {
            const isSelected = selected.games?.includes(game);
            return (
              <button
                key={game}
                onClick={() => handleCheckbox('games', game)}
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${isSelected
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                  }`}
              >
                {game}
              </button>
            );
          })}
        </div>
      </section>

      {/* Sets / Ediciones Dinámicas */}
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-purple-600 rounded-full"></div>
          Expansion / Set
        </h3>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            placeholder="Search sets..."
            value={setSearch}
            onChange={(e) => setSetSearch(e.target.value)}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
          />
        </div>
        <div className="max-h-52 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          {filteredSets.length > 0 ? (
            filteredSets.map(setName => (
              <button
                key={setName}
                onClick={() => handleCheckbox('sets', setName)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-[11px] font-medium transition-all ${selected.sets?.includes(setName)
                  ? 'bg-purple-600/10 text-purple-400'
                  : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                  }`}
              >
                <span className="truncate pr-4">{setName}</span>
                {selected.sets?.includes(setName) && <Check size={12} />}
              </button>
            ))
          ) : (
            <p className="text-[10px] text-neutral-600 italic py-4 text-center">No sets found matching "{setSearch}"</p>
          )}
        </div>
      </section>

      {/* Rareza */}
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-geeko-gold rounded-full"></div>
          Power Rarity
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {filters.rarities.map(rarity => {
            const isSelected = selected.rarities?.includes(rarity);
            return (
              <button
                key={rarity}
                onClick={() => handleCheckbox('rarities', rarity)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${isSelected
                  ? 'bg-geeko-gold/10 border-geeko-gold/40 text-geeko-gold shadow-lg shadow-geeko-gold/5'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-geeko-gold animate-pulse' : 'bg-neutral-700'}`} />
                <span className="text-[10px] font-black uppercase tracking-tight">{rarity}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Colores */}
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-cyan-500 rounded-full"></div>
          Mana Essence
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {filters.colors.map(color => {
            const isSelected = selected.colors?.includes(color);
            const colorMap: Record<string, string> = {
              'White': 'bg-white',
              'Blue': 'bg-blue-500',
              'Black': 'bg-neutral-400',
              'Red': 'bg-red-500',
              'Green': 'bg-green-500',
              'Colorless': 'bg-neutral-600',
              'Multicolor': 'bg-gradient-to-br from-yellow-400 via-red-500 to-blue-500'
            };

            return (
              <button
                key={color}
                onClick={() => handleCheckbox('colors', color)}
                title={color}
                className={`relative group w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${isSelected
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600'
                  }`}
              >
                <div className={`w-3 h-3 rounded-full ${colorMap[color] || 'bg-neutral-500'} ${isSelected ? 'ring-2 ring-white/50 scale-110 shadow-lg' : 'opacity-60 group-hover:opacity-100'} transition-all`} />
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check size={8} className="text-cyan-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="pt-4 mt-8 border-t border-white/5">
        <div className="bg-blue-600/5 rounded-2xl p-4 border border-blue-600/10">
          <p className="text-[10px] font-medium text-neutral-500 mb-2 leading-tight">
            Filters are applied dynamically based on CardKingdom market availability.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 lowercase italic">
            <Filter size={10} />
            Auto-Sync Active
          </div>
        </div>
      </div>
    </aside>
  );
};