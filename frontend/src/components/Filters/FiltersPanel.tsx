import React, { useState, useMemo } from 'react';
import { Search, X, Sliders, Filter, Check, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { rarityMap, typeMap, colorMap } from '../../utils/translations';

const gameNameMap: Record<string, string> = {
  'MTG': 'Magic: The Gathering',
  'POKEMON': 'Pokémon',
  'PKM': 'Pokémon',
  'OPC': 'One Piece',
  'DGM': 'Digimon',
  'LOR': 'Lorcana'
};

export interface Filters {
  games: string[];
  sets: string[];
  rarities: string[];
  colors: string[];
  types: string[];
  categories?: string[];
  yearRange: [number, number];
  priceRange: [number, number];
  only_new?: boolean;
}

export interface FiltersPanelProps {
  filters: Filters;
  selected: Partial<Filters>;
  onChange: (selected: Partial<Filters>) => void;
  setsOptions: string[];
  isAccessoryMode?: boolean;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ filters, selected, onChange, setsOptions, isAccessoryMode }) => {
  const [setSearch, setSetSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    if (selected.games && selected.games.length > 0) initialState.games = true;
    if (selected.sets && selected.sets.length > 0) initialState.sets = true;
    if (selected.categories && selected.categories.length > 0) initialState.categories = true;
    if (selected.rarities && selected.rarities.length > 0) initialState.rarities = true;
    if (selected.colors && selected.colors.length > 0) initialState.colors = true;
    if (selected.types && selected.types.length > 0) initialState.types = true;
    if (selected.priceRange && (selected.priceRange[0] > 0 || selected.priceRange[1] < 1000000)) initialState.price = true;
    if (selected.yearRange && (selected.yearRange[0] > 1993 || selected.yearRange[1] < 2026)) initialState.year = true;
    return initialState;
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredSets = useMemo(() => {
    if (!setSearch) return setsOptions.slice(0, 50);
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

  const hasActiveFilters = Object.values(selected).some(v => v && (typeof v === 'boolean' ? v : (v as any).length > 0));

  const selectedGame = selected.games && selected.games.length === 1 ? selected.games[0] : null;

  const getGameSpecificColors = () => {
    if (selectedGame === 'MTG') return ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'];
    if (selectedGame === 'OPC' || selectedGame === 'ONE PIECE') return ['Red', 'Blue', 'Green', 'Purple', 'Black', 'Yellow'];
    if (selectedGame === 'DGM' || selectedGame === 'DIGIMON') return ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'];
    if (selectedGame === 'PKM' || selectedGame === 'POKEMON') return ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'];
    return []; // No mostrar colores si no hay juego específico o no aplica
  };

  const getGameSpecificTypes = () => {
    if (selectedGame === 'MTG') return ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'];
    if (selectedGame === 'PKM' || selectedGame === 'POKEMON') return ['Pokémon', 'Trainer', 'Energy'];
    if (selectedGame === 'OPC' || selectedGame === 'ONE PIECE') return ['Character', 'Event', 'Stage', 'Leader'];
    return [];
  };

  const currentColors = getGameSpecificColors();
  const currentTypes = getGameSpecificTypes();

  return (
    <aside className="w-full glass-panel border border-white/5 p-8 rounded-[32px] shadow-2xl space-y-10">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm md:text-lg font-black italic tracking-tighter text-white flex items-center gap-2">
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

      {/* Juegos - Ocultar si ya hay uno seleccionado */}
      {!selectedGame && (
        <section className="border-b border-white/5 pb-6">
          <button 
            onClick={() => toggleSection('games')}
            className="w-full flex items-center justify-between text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-geeko-cyan rounded-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"></div>
              Universo de Juegos
            </div>
            {expandedSections.games ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {expandedSections.games && (
            <div className="flex flex-wrap gap-2 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {filters.games.map(game => {
                const isSelected = selected.games?.includes(game);
                return (
                  <button
                    key={game}
                    onClick={() => handleCheckbox('games', game)}
                    className={`px-4 py-2 rounded-xl text-[11px] md:text-[12px] font-bold transition-all border ${isSelected
                      ? 'bg-geeko-violet-accent/20 border-geeko-cyan/40 text-geeko-cyan shadow-lg shadow-geeko-cyan/10'
                      : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'
                      }`}
                  >
                    {gameNameMap[game] || game}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Sets - Solo Singles */}
      {!isAccessoryMode && (
        <section className="border-b border-white/5 pb-6">
          <button 
            onClick={() => toggleSection('sets')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-geeko-violet-accent rounded-full shadow-[0_0_10px_rgba(55,50,102,0.9)]"></div>
              Expansión / Set
            </div>
            {expandedSections.sets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.sets && (
            <div className="pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
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
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-[11px] md:text-[12px] font-medium transition-all ${selected.sets?.includes(setName)
                        ? 'bg-geeko-cyan/10 text-geeko-cyan'
                        : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
                        }`}
                    >
                      <span className="truncate pr-4">{setName}</span>
                      {selected.sets?.includes(setName) && <Check size={12} />}
                    </button>
                  ))
                ) : (
                  <p className="text-[10px] text-neutral-600 italic py-4 text-center">No hay sets.</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Categorías - Solo Catálogo */}
      {isAccessoryMode && filters.categories && (
        <section className="border-b border-white/5 pb-6">
          <button 
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
              Categoría
            </div>
            {expandedSections.categories ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.categories && (
            <div className="grid grid-cols-1 gap-2 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {filters.categories
                .filter(cat => {
                  if (!selectedGame) return true;
                  const otherGames = ['Magic', 'Pokemon', 'Digimon', 'One Piece', 'Yu-Gi-Oh', 'Weiss Schwarz'].filter(g => {
                    if (selectedGame === 'MTG' && g === 'Magic') return false;
                    if ((selectedGame === 'PKM' || selectedGame === 'POKEMON') && g === 'Pokemon') return false;
                    if ((selectedGame === 'DGM' || selectedGame === 'DIGIMON') && g === 'Digimon') return false;
                    if ((selectedGame === 'OPC' || selectedGame === 'ONE PIECE') && g === 'One Piece') return false;
                    if (selectedGame === 'YGO' && g === 'Yu-Gi-Oh') return false;
                    return ['Magic', 'Pokemon', 'Digimon', 'One Piece', 'Yu-Gi-Oh', 'Weiss Schwarz'].includes(g);
                  });
                  return !otherGames.includes(cat);
                })
                .map(category => {
                  const isSelected = selected.categories?.includes(category);
                  return (
                    <button
                      key={category}
                      onClick={() => handleCheckbox('categories' as any, category)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all ${isSelected
                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-lg shadow-orange-500/5'
                        : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Package size={14} className={isSelected ? 'text-orange-400' : 'text-neutral-600'} />
                        <span className="text-[10px] font-black uppercase tracking-tight">{category}</span>
                      </div>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {/* Rareza - Solo para Cartas */}
      {!isAccessoryMode && filters.rarities && (
        <section className="border-b border-white/5 pb-6">
          <button 
            onClick={() => toggleSection('rarities')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-geeko-gold rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)]"></div>
              Rareza
            </div>
            {expandedSections.rarities ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.rarities && (
            <div className="grid grid-cols-2 gap-2 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
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
                    <span className="text-[10px] font-black uppercase tracking-tight">{rarityMap[rarity] || rarity}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Colores Contextuales */}
      {!isAccessoryMode && currentColors.length > 0 && (
        <section className="border-b border-white/5 pb-6">
          <button 
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-geeko-cyan rounded-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"></div>
              {selectedGame === 'MTG' ? 'Mana (Colores)' : 'Colores'}
            </div>
            {expandedSections.colors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.colors && (
            <div className="grid grid-cols-4 gap-2 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {currentColors.map(color => {
                const isSelected = selected.colors?.includes(color);
                const colorClassMap: Record<string, string> = {
                  'White': 'bg-[#F8E7B9] shadow-[0_0_10px_#F8E7B9]',
                  'Blue': 'bg-[#0E68AB] shadow-[0_0_10px_#0E68AB]',
                  'Black': 'bg-[#150B00] shadow-[0_0_10px_#150B00] border border-white/20',
                  'Red': 'bg-[#D3202A] shadow-[0_0_10px_#D3202A]',
                  'Green': 'bg-[#00733E] shadow-[0_0_10px_#00733E]',
                  'Colorless': 'bg-[#D3D3D3] shadow-[0_0_10px_#D3D3D3]',
                  'Multicolor': 'bg-gradient-to-br from-[#F8E7B9] via-[#D3202A] to-[#0E68AB]',
                  'Grass': 'bg-[#7db808]', 'Fire': 'bg-[#e3350d]', 'Water': 'bg-[#318bc9]', 'Lightning': 'bg-[#eed535]',
                  'Psychic': 'bg-[#a33ea1]', 'Fighting': 'bg-[#ce4069]', 'Darkness': 'bg-[#707070]', 'Metal': 'bg-[#b7b7ce]',
                  'Fairy': 'bg-[#fdb9e9]', 'Dragon': 'bg-[#53a4cf]',
                  'Purple': 'bg-[#800080]', 'Yellow': 'bg-[#ffff00]',
                };

                return (
                  <button
                    key={color}
                    onClick={() => handleCheckbox('colors', color)}
                    title={colorMap[color] || color}
                    className={`relative group w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${isSelected
                      ? 'border-geeko-cyan/50 bg-geeko-cyan/10'
                      : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600'
                      }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${colorClassMap[color] || 'bg-neutral-500'} ${isSelected ? 'scale-125' : 'opacity-80 group-hover:opacity-100'} transition-all`} />
                    {isSelected && <div className="absolute top-1 right-1"><Check size={8} className="text-geeko-cyan" /></div>}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tipos Contextuales */}
      {!isAccessoryMode && currentTypes.length > 0 && (
        <section className="border-b border-white/5 pb-6">
          <button 
            onClick={() => toggleSection('types')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-neutral-600 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-red-600 rounded-full"></div>
              {selectedGame === 'MTG' ? 'Tipo de Carta' : 'Tipo'}
            </div>
            {expandedSections.types ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.types && (
            <div className="flex flex-wrap gap-2 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {currentTypes.map(type => {
                const isSelected = selected.types?.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => handleCheckbox('types', type)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold transition-all border ${isSelected
                      ? 'bg-red-600/10 border-red-500/50 text-red-400'
                      : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    {typeMap[type] || type}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Rango de Precio */}
      <section className="border-b border-white/5 pb-6">
        <button 
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-geeko-gold rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)]"></div>
            Precio (USD)
          </div>
          {expandedSections.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expandedSections.price && (
          <div className="flex items-center gap-3 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <input
              type="number"
              placeholder="Mín"
              value={selected.priceRange?.[0] || ''}
              onChange={(e) => onChange({ ...selected, priceRange: [parseFloat(e.target.value) || 0, selected.priceRange?.[1] || 1000000] })}
              className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-geeko-gold/50"
            />
            <span className="text-neutral-700">→</span>
            <input
              type="number"
              placeholder="Máx"
              value={selected.priceRange?.[1] || ''}
              onChange={(e) => onChange({ ...selected, priceRange: [selected.priceRange?.[0] || 0, parseFloat(e.target.value) || 1000000] })}
              className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-geeko-gold/50"
            />
          </div>
        )}
      </section>

      {/* Timeline / Año */}
      {!isAccessoryMode && (
        <section className="pb-6">
          <button 
            onClick={() => toggleSection('year')}
            className="w-full flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-2 hover:text-neutral-300 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
              Año
            </div>
            {expandedSections.year ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expandedSections.year && (
            <div className="flex items-center gap-3 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <input
                type="number"
                placeholder="Desde"
                value={selected.yearRange?.[0] || ''}
                onChange={(e) => onChange({ ...selected, yearRange: [parseInt(e.target.value) || 1993, selected.yearRange?.[1] || 2026] })}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-emerald-500/50"
              />
              <span className="text-neutral-700">→</span>
              <input
                type="number"
                placeholder="Hasta"
                value={selected.yearRange?.[1] || ''}
                onChange={(e) => onChange({ ...selected, yearRange: [selected.yearRange?.[0] || 1993, parseInt(e.target.value) || 2026] })}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2 px-3 text-[11px] text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          )}
        </section>
      )}

      <div className="pt-6 mt-10 border-t border-white/5">
        <div className="bg-geeko-cyan/5 rounded-2xl p-5 border border-geeko-cyan/20 relative overflow-hidden group">
          <p className="text-[10px] font-medium text-neutral-400 mb-3 leading-relaxed relative z-10">
            Sincronización en tiempo real activa vía <span className="text-geeko-cyan">Neural Link</span>.
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