import { useState, useEffect } from 'react';
import { Database, Clock, Calendar, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE;

interface Job {
    id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    duration_ms: number | null;
    items_updated: number;
    source: string;
    error_log: string | null;
}

interface PriceChange {
    timestamp: string;
    price_usd: number;
    is_foil: boolean;
    condition_id: number;
    price_type: string;
    card_name: string;
    set_code: string;
}

export const PriceUpdateHistory = () => {
    const { session } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [jobDetails, setJobDetails] = useState<Record<string, PriceChange[]>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/price-update-jobs`, {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
            }
        } catch (err) {
            console.error("Error fetching price update jobs", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleJob = async (jobId: string) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
            return;
        }
        
        setExpandedJobId(jobId);
        
        if (!jobDetails[jobId] && !loadingDetails[jobId]) {
            setLoadingDetails(prev => ({ ...prev, [jobId]: true }));
            try {
                const res = await fetch(`${API_BASE}/api/admin/price-update-jobs/${jobId}/details`, {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setJobDetails(prev => ({ ...prev, [jobId]: data }));
                }
            } catch (err) {
                console.error("Error fetching job details", err);
            } finally {
                setLoadingDetails(prev => ({ ...prev, [jobId]: false }));
            }
        }
    };

    const formatDuration = (ms: number | null) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const remSecs = seconds % 60;
        return `${mins}m ${remSecs}s`;
    };

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm mt-12">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Database className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Histórico de Actualización</h2>
                        <p className="text-slate-400 text-xs mt-1">Registro de sincronización de precios e inventario en bloque</p>
                    </div>
                </div>
                <button 
                    onClick={fetchJobs} 
                    className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition border border-white/5 uppercase tracking-widest font-bold text-slate-300"
                >
                    Refrescar
                </button>
            </div>

            <div className="p-6">
                {loading && jobs.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm font-bold animate-pulse">
                        CARGANDO HISTORIAL...
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No hay registros de actualizaciones todavía.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map(job => (
                            <div key={job.id} className="border border-white/5 bg-slate-900 rounded-xl overflow-hidden transition-all duration-300">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    onClick={() => toggleJob(job.id)}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center justify-center">
                                            {job.status === 'completed' ? (
                                                <CheckCircle className="w-6 h-6 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            ) : job.status === 'running' ? (
                                                <div className="w-6 h-6 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            )}
                                        </div>
                                        
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-200">{job.source || 'Sincronización de Sistema'}</span>
                                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-700">
                                                    {job.items_updated} Cartas
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(job.started_at).toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatDuration(job.duration_ms)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-slate-500">
                                        {expandedJobId === job.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {expandedJobId === job.id && (
                                    <div className="bg-slate-950/50 p-4 border-t border-white/5">
                                        {loadingDetails[job.id] ? (
                                            <div className="text-center py-6 text-slate-500 text-xs tracking-widest uppercase animate-pulse">
                                                Obteniendo detalles del log...
                                            </div>
                                        ) : jobDetails[job.id]?.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="text-slate-500 uppercase tracking-widest border-b border-white/5">
                                                            <th className="pb-3 font-semibold">Carta</th>
                                                            <th className="pb-3 font-semibold">Set</th>
                                                            <th className="pb-3 font-semibold">Acabado</th>
                                                            <th className="pb-3 font-semibold text-right">Nuevo Precio</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {jobDetails[job.id].map((detail, idx) => (
                                                            <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                                                                <td className="py-3 font-bold text-slate-300">{detail.card_name}</td>
                                                                <td className="py-3 text-slate-400 font-mono text-[10px] uppercase">{detail.set_code}</td>
                                                                <td className="py-3">
                                                                    {detail.is_foil ? (
                                                                        <span className="text-[#00D1FF] bg-[#00D1FF]/10 border border-[#00D1FF]/20 px-2 py-0.5 rounded text-[10px] font-bold">FOIL</span>
                                                                    ) : (
                                                                        <span className="text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">NORMAL</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1 font-mono text-emerald-400 font-bold">
                                                                        <DollarSign className="w-3 h-3" />
                                                                        {detail.price_usd.toFixed(2)}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {jobDetails[job.id].length >= 100 && (
                                                    <div className="text-center mt-4 text-[10px] text-slate-500 uppercase tracking-widest">
                                                        Mostrando los primeros 100 registros
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-slate-500 text-xs">
                                                No se encontraron registros de cartas para este proceso o la sincronización falló antes de actualizar precios.
                                            </div>
                                        )}
                                        
                                        {job.error_log && (
                                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-mono break-words whitespace-pre-wrap">
                                                {job.error_log}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
