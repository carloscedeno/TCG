import { useState, useEffect } from 'react';
import { MousePointer2, Eye, BarChart3, RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface CloudflareStats {
    success: boolean;
    data: any[];
    summary: {
        total_requests: number;
        total_pageviews: number;
    };
    error?: string;
}

export const CloudflareAnalytics = ({ session, apiBase }: { session: any, apiBase: string }) => {
    const [stats, setStats] = useState<CloudflareStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px] animate-pulse">
            <RefreshCw className="w-8 h-8 text-white/20 animate-spin mb-4" />
            <span className="text-white/30 font-black text-xs uppercase tracking-widest">Sincronizando con Cloudflare...</span>
        </div>
    );

    if (error) return (
        <div className="bg-slate-900/50 border border-red-500/20 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[300px]">
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
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 size={120} className="text-white" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                            <BarChart3 className="text-[#00D1FF]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic text-white leading-none mb-1">MÉTRICAS CLOUDFLARE</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Tráfico Real en las Últimas 24h</p>
                        </div>
                    </div>
                    <button 
                        onClick={fetchAnalytics}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <MousePointer2 size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requests</span>
                        </div>
                        <p className="text-3xl font-black text-white italic">{stats?.summary.total_requests.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Eye size={14} className="text-blue-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Views</span>
                        </div>
                        <p className="text-3xl font-black text-white italic">{stats?.summary.total_pageviews.toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {stats?.data.slice().reverse().map((group: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                            <div className="flex items-center gap-3">
                                <Clock size={12} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-300">
                                    {new Date(group.dimensions.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <span className="block text-[8px] font-black text-slate-500 uppercase">Reqs</span>
                                    <span className="text-[10px] font-black text-emerald-400">{group.sum.requests}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[8px] font-black text-slate-500 uppercase">Views</span>
                                    <span className="text-[10px] font-black text-blue-400">{group.sum.pageViews}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
