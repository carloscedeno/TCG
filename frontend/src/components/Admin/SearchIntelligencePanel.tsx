import { useState, useEffect } from 'react';
import { Search, AlertTriangle, MousePointerClick, ShoppingBag, RefreshCw, Sparkles, Clock } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface SearchIntelligenceData {
  days: number;
  summary: {
    total_sessions: number;
    resolved_sessions: number;
    cart_conversions: number;
    zero_result_sessions: number;
    abandoned_sessions: number;
  };
  top_cards: {
    term: string;
    card_id: string | null;
    searches: number;
    clicks: number;
    cart_adds: number;
    avg_results: number;
    last_seen: string;
  }[];
  zero_results: {
    term: string;
    searches: number;
    games: string[];
    last_seen: string;
  }[];
  partial_unresolved: {
    term: string;
    searches: number;
    last_resolution: string;
    avg_results: number;
    last_seen: string;
  }[];
  recent: {
    raw_query: string;
    resolved_name: string | null;
    game_filter: string | null;
    results_count: number;
    resolution_type: string;
    updated_at: string;
  }[];
}

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
  const [data, setData] = useState<SearchIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntelligence = async (targetDays = days) => {
    setLoading(true);
    setError(null);
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_search_intelligence', {
        p_days: targetDays,
      });
      if (rpcError) throw rpcError;
      setData(rpcData as SearchIntelligenceData);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar analítica de búsquedas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence(days);
  }, [days]);

  const total = data?.summary?.total_sessions || 0;
  const resolved = data?.summary?.resolved_sessions || 0;
  const cartAdds = data?.summary?.cart_conversions || 0;
  const zeroRes = data?.summary?.zero_result_sessions || 0;
  const clickRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const zeroRate = total > 0 ? Math.round((zeroRes / total) * 100) : 0;

  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <Search className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic text-white leading-none mb-1">
              SEO INTERNO & BUSCADOR
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Intención de búsqueda consolidada (sin ruido de tipeo)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                days === d
                  ? 'bg-[#00D1FF] text-black'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => fetchIntelligence(days)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors ml-1"
            title="Actualizar"
          >
            <RefreshCw size={16} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {data.top_cards.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">{item.term}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.clicks} clics · {item.cart_adds} carrito · ~{item.avg_results} res
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#00D1FF] bg-[#00D1FF]/10 px-2.5 py-1 rounded-lg">
                        {item.searches}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-8 text-center">Sin búsquedas registradas aún.</p>
              )}
            </div>

            {/* Zero Results */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" /> Demanda Insatisfecha (0 Res)
              </h3>
              {data?.zero_results?.length ? (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {data.zero_results.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-red-200 truncate">{item.term}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.games?.length ? item.games.join(', ') : 'Todos los juegos'}
                        </p>
                      </div>
                      <span className="text-xs font-black text-red-300 bg-red-500/20 px-2.5 py-1 rounded-lg">
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
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {data.partial_unresolved.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-amber-200 truncate">{item.term}</p>
                        <p className="text-[10px] text-slate-400">
                          ~{item.avg_results} resultados mostrados
                        </p>
                      </div>
                      <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
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
                        <p className="text-[10px] text-slate-500">
                          {ev.game_filter || 'ALL'} · {ev.results_count} res ·{' '}
                          {new Date(ev.updated_at).toLocaleString()}
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
