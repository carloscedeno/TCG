import React from 'react';

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
  const handleCheckbox = (key: keyof Filters, value: string) => {
    const prev = selected[key] || [];
    if (prev.includes(value)) {
      onChange({ ...selected, [key]: prev.filter((v: string) => v !== value) });
    } else {
      onChange({ ...selected, [key]: [...prev, value] });
    }
  };

  return (
    <aside className="w-full bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
        <span>🔍</span> Filters
      </h2>

      {/* Juegos */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Game</h3>
        <div className="flex flex-col gap-2">
          {filters.games.map(game => (
            <label key={game} className="flex items-center gap-3 text-sm cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={selected.games?.includes(game) || false}
                  onChange={() => handleCheckbox('games', game)}
                  className="peer h-5 w-5 appearance-none rounded border border-neutral-700 bg-neutral-800 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                />
                <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-300 group-hover:text-white transition-colors">{game}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sets */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Set / Edition</h3>
        <select
          className="w-full px-3 py-2.5 rounded-lg border border-neutral-700 bg-neutral-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          value={selected.sets?.[0] || ''}
          onChange={e => onChange({ ...selected, sets: e.target.value ? [e.target.value] : [] })}
        >
          <option value="">All Sets</option>
          {setsOptions.map(set => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>
      </div>

      {/* Rareza */}
      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Rarity</h3>
        <div className="flex flex-col gap-2">
          {filters.rarities.map(rarity => (
            <label key={rarity} className="flex items-center gap-3 text-sm cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={selected.rarities?.includes(rarity) || false}
                  onChange={() => handleCheckbox('rarities', rarity)}
                  className="peer h-5 w-5 appearance-none rounded border border-neutral-700 bg-neutral-800 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                />
                <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-300 group-hover:text-white transition-colors">{rarity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Colores */}
      <div className="mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Color</h3>
        <div className="grid grid-cols-2 gap-2">
          {filters.colors.map(color => (
            <label key={color} className="flex items-center gap-2 text-xs cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.colors?.includes(color) || false}
                onChange={() => handleCheckbox('colors', color)}
                className="peer h-4 w-4 appearance-none rounded border border-neutral-700 bg-neutral-800 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
              />
              <span className="text-neutral-400 group-hover:text-white transition-colors">{color}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};