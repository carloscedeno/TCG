import { useState, useEffect, useCallback } from 'react';
import {
  Search, AlertTriangle, MousePointerClick, ShoppingBag,
  RefreshCw, Sparkles, Clock, Download, Filter, RotateCcw
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface TopCardMetric {
  term: string;
  card_id: string | null;
  game: string | null;
  rarity: string | null;
  type_line: string | null;
  set_code: string | null;
  current_stock: number;
  searches: number;
  clicks: number;
  cart_adds: number;
  avg_results: number;
  last_seen: string;
}

interface SearchIntelligenceData {
  days: number;
  summary: {
    total_sessions: number;
    resolved_sessions: number;
    cart_conversions: number;
    zero_result_sessions: number;
    abandoned_sessions: number;
  };
  top_cards: TopCardMetric[];
  zero_results: {
    term: string;
    searches: number;
    games: string[];
    rarity: string | null;
    type_line: string | null;
    last_seen: string;
  }[];
  partial_unresolved: {
    term: string;
    searches: number;
    last_resolution: string;
    game: string | null;
    avg_results: number;
    last_seen: string;
  }[];
  recent: {
    raw_query: string;
    resolved_name: string | null;
    game_filter: string | null;
    rarity: string | null;
    type_line: string | null;
    results_count: number;
    resolution_type: string;
    updated_at: string;
  }[];
}

const GAME_OPTIONS = ['MTG', 'PKM', 'YGO', 'RFB', 'OPC', 'DGM', 'GND', 'FAB', 'OTHERS'];
const TYPE_OPTIONS = ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'];
const RARITY_OPTIONS = ['Common', 'Uncommon', 'Rare', 'Mythic'];

const RESOLUTION_LABELS: Record<string, { label: string; color: string }> = {
  cart_add: { label: 'Al Carrito', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  card_click: { label: 'Clic Carta', color: 'bg-cyan-500/20 text-[#00D1FF] border-cyan-500/30' },
  suggestion_click: { label: 'Sugerencia', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  submit: { label: 'Enter', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  idle_settle: { label: 'Pausa', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  abandon: { label: 'Abandonada', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  zero_results: { label: '0 Resultados', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export const SearchIntelligencePanel = () => {
  const [days, setDays] = useState<number>(30);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [gameFilter, setGameFilter] = useState<string>('');
  const [cardType, setCardType] = useState<string>('');
  const [rarity, setRarity] = useState<string>('');
  const [resolutionType, setResolutionType] = useState<string>('');
  const [tabFilter, setTabFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');

  const [data, setData] = useState<SearchIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromIso = dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : null;
      const toIso = dateTo ? new Date(`${dateTo}T23:59:59.999`).toISOString() : null;

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_search_intelligence', {
        p_days: days,
        p_date_from: fromIso,
        p_date_to: toIso,
        p_game: gameFilter || null,
        p_card_type: cardType || null,
        p_rarity: rarity || null,
        p_resolution_type: resolutionType || null,
        p_tab: tabFilter || null,
        p_search_text: searchText.trim() || null,
      });
      if (rpcError) throw rpcError;
      setData(rpcData as SearchIntelligenceData);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Error al cargar analítica de búsquedas';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [days, dateFrom, dateTo, gameFilter, cardType, rarity, resolutionType, tabFilter, searchText]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchIntelligence();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchIntelligence]);

  const handleResetFilters = () => {
    setDays(30);
    setDateFrom('');
    setDateTo('');
    setGameFilter('');
    setCardType('');
    setRarity('');
    setResolutionType('');
    setTabFilter('');
    setSearchText('');
  };

  const handleExportCsv = () => {
    if (!data) return;
    const rows: string[][] = [
      ['Seccion', 'Termino / Carta', 'Juego', 'Rareza', 'Tipo', 'Set', 'Stock Actual', 'Busquedas', 'Clics', 'Al Carrito', 'Prom Resultados'],
      ...data.top_cards.map((c) => [
        'Top Buscadas',
        c.term,
        c.game || '',
        c.rarity || '',
        c.type_line || '',
        c.set_code || '',
        String(c.current_stock ?? 0),
        String(c.searches),
        String(c.clicks),
        String(c.cart_adds),
        String(c.avg_results),
      ]),
      ...data.zero_results.map((z) => [
        'Demanda 0 Resultados',
        z.term,
        (z.games || []).join('|'),
        z.rarity || '',
        z.type_line || '',
        '',
        '0',
        String(z.searches),
        '0',
        '0',
        '0',
      ]),
    ];

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `geekorium_search_seo_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const total = data?.summary?.total_sessions || 0;
  const resolved = data?.summary?.resolved_sessions || 0;
  const cartAdds = data?.summary?.cart_conversions || 0;
  const zeroRes = data?.summary?.zero_result_sessions || 0;
  const clickRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const zeroRate = total > 0 ? Math.round((zeroRes / total) * 100) : 0;

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shrink-0">
            <Search className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic text-white leading-none mb-1">
              SEO INTERNO & BUSCADOR
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Cartas más buscadas, demanda sin stock y filtros por fecha / tipo / rareza
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[1, 7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setDays(d);
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                !dateFrom && !dateTo && days === d
                  ? 'bg-[#00D1FF] text-black'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {d === 1 ? 'Hoy' : `${d}d`}
            </button>
          ))}
          <button
            onClick={handleExportCsv}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={fetchIntelligence}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Actualizar"
          >
            <RefreshCw size={16} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Filter size={12} className="text-[#00D1FF]" /> Filtros Avanzados
          </span>
          <button
            onClick={handleResetFilters}
            className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} /> Limpiar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Juego</label>
            <select
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
            >
              <option value="">Todos</option>
              {GAME_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Tipo</label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
            >
              <option value="">Todos</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Rareza</label>
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
            >
              <option value="">Todas</option>
              {RARITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Resolución</label>
            <select
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
            >
              <option value="">Todas</option>
              {Object.entries(RESOLUTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Buscar término / Tab</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Ej. bolt, sol..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00D1FF]"
              />
              <select
                value={tabFilter}
                onChange={(e) => setTabFilter(e.target.value)}
                title="Sección"
                className="bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF]"
              >
                <option value="">Todo</option>
                <option value="marketplace">Singles</option>
                <option value="catalog">Artilugios</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-bold">
          {error}
        </div>
      ) : loading && !data ? (
        <div className="py-16 flex flex-col items-center justify-center animate-pulse">
          <RefreshCw className="w-7 h-7 text-white/20 animate-spin mb-3" />
          <span className="text-white/30 font-black text-xs uppercase tracking-widest">
            Analizando intenciones de búsqueda...
          </span>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-[#00D1FF]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sesiones</span>
              </div>
              <p className="text-3xl font-black text-white italic">{total.toLocaleString()}</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick size={14} className="text-purple-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolución</span>
              </div>
              <p className="text-3xl font-black text-white italic">{clickRate}%</p>
              <span className="text-[10px] text-slate-500 font-bold">{resolved} clics en carta</span>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Al Carrito</span>
              </div>
              <p className="text-3xl font-black text-white italic">{cartAdds.toLocaleString()}</p>
            </div>

            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin Stock / 0 Res</span>
              </div>
              <p className="text-3xl font-black text-white italic">{zeroRate}%</p>
              <span className="text-[10px] text-slate-500 font-bold">{zeroRes} búsquedas fallidas</span>
            </div>
          </div>

          {/* 3 Intelligence Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top Cards */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-[#00D1FF]" /> Top Cartas Buscadas
              </h3>
              {data?.top_cards?.length ? (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {data.top_cards.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">{item.term}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.game && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                              {item.game}
                            </span>
                          )}
                          {item.rarity && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              {item.rarity}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {item.clicks} clics · {item.cart_adds} carrito · stock: {item.current_stock ?? 0}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#00D1FF] bg-[#00D1FF]/10 px-2.5 py-1 rounded-lg shrink-0">
                        {item.searches}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">Sin búsquedas para estos filtros.</p>
              )}
            </div>

            {/* Zero Results */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" /> Demanda Insatisfecha (0 Res)
              </h3>
              {data?.zero_results?.length ? (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {data.zero_results.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-red-200 truncate">{item.term}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.games?.length ? item.games.join(', ') : 'Todos los juegos'}
                          {item.rarity ? ` · ${item.rarity}` : ''}
                          {item.type_line ? ` · ${item.type_line}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-black text-red-300 bg-red-500/20 px-2.5 py-1 rounded-lg shrink-0">
                        {item.searches}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">Sin búsquedas con 0 resultados.</p>
              )}
            </div>

            {/* Partial Unresolved */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={14} className="text-amber-400" /> Parciales Sin Clic
              </h3>
              {data?.partial_unresolved?.length ? (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {data.partial_unresolved.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-amber-200 truncate">{item.term}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.game ? `${item.game} · ` : ''}~{item.avg_results} resultados mostrados
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg shrink-0">
                        {item.searches}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">Sin búsquedas parciales abandonadas.</p>
              )}
            </div>
          </div>

          {/* Recent Stream */}
          {data?.recent && data.recent.length > 0 && (
            <div>
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Últimas Intenciones Consolidadas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto pr-1">
                {data.recent.map((ev, idx) => {
                  const badge = RESOLUTION_LABELS[ev.resolution_type] || RESOLUTION_LABELS.idle_settle;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">
                          "{ev.raw_query}"
                          {ev.resolved_name && ev.resolved_name.toLowerCase() !== ev.raw_query.toLowerCase() && (
                            <span className="text-[#00D1FF] ml-1.5">→ {ev.resolved_name}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {ev.game_filter || 'ALL'}
                          {ev.rarity ? ` · ${ev.rarity}` : ''}
                          {ev.type_line ? ` · ${ev.type_line}` : ''}
                          {` · ${ev.results_count} res · ${new Date(ev.updated_at).toLocaleString()}`}
                        </p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
