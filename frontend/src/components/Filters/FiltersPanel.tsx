import React, { useState, useMemo } from 'react';
import { Search, X, Sliders, Filter, Check } from 'lucide-react';

export interface Filters {
  games: string[];
  sets: string[];
  rarities: string[];
  colors: string[];
  types: string[];
  yearRange: [number, number];
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

  const handleCheckbox = (key: keyof Omit<Filters, 'yearRange'>, value: string) => {
    const prev = (selected[key] as string[]) || [];
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
    <aside className="w-full glass-panel border border-white/5 p-8 rounded-[32px] shadow-2xl space-y-10">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-black italic tracking-tighter text-white flex items-center gap-2">
          <Sliders size={18} className="text-geeko-cyan" />
          FILTROS
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1 group"
          >
            <X size={10} className="group-hover:rotate-90 transition-transform" />
            Reiniciar
          </button>
        )}
      </div>

      {/* Juegos */}
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-geeko-cyan rounded-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"></div>
          Universo de Juegos
        </h3>
        <div className="flex flex-wrap gap-2">
          {filters.games.map(game => {
            const isSelected = selected.games?.includes(game);
            return (
              <button
                key={game}
                onClick={() => handleCheckbox('games', game)}
                data-active={isSelected}
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
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
          Expansión / Set
        </h3>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
          <input
            type="text"
            placeholder="Buscar sets..."
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
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-geeko-gold rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)]"></div>
          Rareza
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
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"></div>
          Esencia de Mana (Colores)
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

      {/* Timeline / Año */}
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
          Órbita Temporal (Año)
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Desde"
            value={selected.yearRange?.[0] || ''}
            onChange={(e) => onChange({ ...selected, yearRange: [parseInt(e.target.value) || 1993, selected.yearRange?.[1] || 2026] })}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <span className="text-neutral-700 font-bold">→</span>
          <input
            type="number"
            placeholder="Hasta"
            value={selected.yearRange?.[1] || ''}
            onChange={(e) => onChange({ ...selected, yearRange: [selected.yearRange?.[0] || 1993, parseInt(e.target.value) || 2026] })}
            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <div className="mt-3 flex justify-between text-[8px] font-black tracking-widest text-neutral-600 uppercase">
          <span>Orígenes (1993)</span>
          <span>Presente (2026)</span>
        </div>
      </section>
      <section>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-4 flex items-center gap-2">
          <div className="w-1 h-3 bg-red-600 rounded-full"></div>
          Esencia de Carta (Tipo)
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'].map(type => {
            const isSelected = selected.types?.includes(type);
            return (
              <button
                key={type}
                onClick={() => handleCheckbox('types', type)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isSelected
                  ? 'bg-red-600/10 border-red-500/50 text-red-400'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </section>

      <div className="pt-6 mt-10 border-t border-white/5">
        <div className="bg-geeko-cyan/5 rounded-2xl p-5 border border-geeko-cyan/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <p className="text-[10px] font-medium text-neutral-400 mb-3 leading-relaxed relative z-10">
            Sincronización en tiempo real activa vía <span className="text-geeko-cyan">Neural Link</span> con mercados globales.
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black text-geeko-cyan uppercase tracking-widest relative z-10">
            <Filter size={12} className="animate-pulse" />
            Sincro Cuántica: ON
          </div>
        </div>
      </div>
    </aside>
  );
};