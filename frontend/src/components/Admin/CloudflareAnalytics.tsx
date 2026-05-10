import { useState, useEffect } from 'react';
import { MousePointer2, Eye, RefreshCw, AlertCircle, Clock, Shield, Zap, Activity } from 'lucide-react';

interface CloudflareStats {
    success: boolean;
    data: any[];
    top_countries: { country: string, requests: number }[];
    top_paths: { path: string, requests: number }[];
    security: { threats_blocked: number };
    summary: {
        total_requests: number;
        total_pageviews: number;
        cache_hit_ratio: number;
        total_bandwidth_gb: number;
    };
    error?: string;
}

export const CloudflareAnalytics = ({ session, apiBase }: { session: any, apiBase: string }) => {
    const [stats, setStats] = useState<CloudflareStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBase}/api/admin/cloudflare/analytics`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await response.json();
            
            if (data.error) {
                setError(data.error);
            } else {
                setStats(data);
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] animate-pulse">
            <RefreshCw className="w-8 h-8 text-white/20 animate-spin mb-4" />
            <span className="text-white/30 font-black text-xs uppercase tracking-widest text-center">
                Sincronizando con Cloudflare Intelligence...
            </span>
        </div>
    );

    if (error) return (
        <div className="bg-slate-900/50 border border-red-500/20 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px]">
            <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
            <h3 className="text-white font-black italic uppercase mb-2">Error de Analíticas</h3>
            <p className="text-slate-400 text-[10px] font-bold text-center max-w-xs">{error}</p>
            <button 
                onClick={fetchAnalytics}
                className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
                Reintentar
            </button>
        </div>
    );

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 overflow-hidden relative group">
            {/* Background Icon Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <Shield size={120} className="text-[#00D1FF]" />
            </div>
            
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#00D1FF]/10 rounded-2xl flex items-center justify-center border border-[#00D1FF]/20">
                            <Activity className="text-[#00D1FF]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic text-white leading-none mb-1">MÉTRICAS CLOUDFLARE</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={10} className="text-yellow-400" />
                                    Últimas 24 horas de actividad
                                </p>
                                <button 
                                    onClick={() => setShowHelp(!showHelp)}
                                    className="text-[9px] font-black text-[#00D1FF] uppercase bg-[#00D1FF]/10 px-2 py-0.5 rounded-full hover:bg-[#00D1FF]/20 transition-colors"
                                >
                                    {showHelp ? 'Cerrar Ayuda' : '¿Qué significa esto?'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={fetchAnalytics}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors group/btn"
                        title="Actualizar"
                    >
                        <RefreshCw size={18} className="text-slate-400 group-hover/btn:text-white group-hover/btn:rotate-180 transition-all duration-500" />
                    </button>
                </div>

                {/* Help Section */}
                {showHelp && (
                    <div className="mb-8 p-6 bg-[#00D1FF]/5 border border-[#00D1FF]/20 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <h4 className="text-[10px] font-black text-[#00D1FF] uppercase mb-2 flex items-center gap-2">
                                    <MousePointer2 size={12} /> ¿Peticiones a qué?
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                                    A todo el contenido: imágenes de cartas, precios que vienen de APIs externas, scripts para que funcione el carrito y la carga inicial de la tienda.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2 flex items-center gap-2">
                                    <Eye size={12} /> ¿Vistas a dónde?
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                                    Específicamente a las páginas que ven tus clientes: Home, buscador de cartas, detalles de un producto y el panel administrativo.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-yellow-400 uppercase mb-2 flex items-center gap-2">
                                    <Clock size={12} /> ¿Hora de qué?
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                                    Es la ventana de 60 minutos donde ocurrió la actividad. Te sirve para saber en qué momento del día entran más clientes a tu tienda.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <MousePointer2 size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peticiones</span>
                        </div>
                        <p className="text-3xl font-black text-white italic">{stats?.summary.total_requests.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vistas</span>
                        </div>
                        <p className="text-3xl font-black text-white italic">{stats?.summary.total_pageviews.toLocaleString()}</p>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield size={14} className="text-red-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amenazas</span>
                        </div>
                        <p className="text-3xl font-black text-white italic">{stats?.security.threats_blocked || 0}</p>
                    </div>

                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={14} className="text-yellow-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caché</span>
                        </div>
                        <p className="text-3xl font-black text-white italic">{stats?.summary.cache_hit_ratio}%</p>
                    </div>
                </div>

                {/* Activity Layout */}
                <div className="w-full">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock size={14} className="text-[#00D1FF]" />
                        <div>
                            <h3 className="text-[12px] font-black text-white uppercase tracking-widest italic leading-none">Actividad por Hora</h3>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Historial de tráfico de las últimas 24h</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {stats?.data.slice().reverse().map((group: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                                        <Clock size={12} className="text-[#00D1FF]" />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-300">
                                        {new Date(group.dimensions.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-right">
                                        <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest">Peticiones</span>
                                        <span className="text-[11px] font-black text-emerald-400">{group.sum.requests.toLocaleString() || '0'}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[7px] font-black text-slate-500 uppercase tracking-widest">Vistas</span>
                                        <span className="text-[11px] font-black text-blue-400">{group.sum.pageViews.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Total de datos transferidos: <span className="text-white italic">{stats?.summary.total_bandwidth_gb} GB</span>
                    </div>
                    <div className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">
                        Powered by Cloudflare v4 Analytics
                    </div>
                </div>
            </div>
        </div>
    );
};
