import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Play, Settings, Users, Database, Shield, AlertCircle } from 'lucide-react';

const SUPABASE_PROJECT_ID = 'sxuotvogwvmxuvwbsscv';
const API_BASE = import.meta.env.VITE_API_BASE || `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/tcg-api`;

export const AdminDashboard = () => {
    const { user, session, isAdmin, loading } = useAuth();
    const [running, setRunning] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, any>>({});
    const [stats, setStats] = useState({
        total_cards: '0',
        total_users: '0',
        total_updates: '0'
    });
    const [activeTasks, setActiveTasks] = useState<any[]>([]);
    const [selectedTaskLog, setSelectedTaskLog] = useState<{ id: string, logs: string } | null>(null);
    const [showLogModal, setShowLogModal] = useState(false);
    const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

    // GitHub Automation State
    const [githubToken, setGithubToken] = useState(localStorage.getItem('geeko_gh_token') || '');
    const [isTriggeringGit, setIsTriggeringGit] = useState(false);

    useEffect(() => {
        if (user && isAdmin) {
            fetchStats();
            fetchTasks();
            const interval = setInterval(() => {
                fetchTasks();
                fetchStats();
            }, 5000); // Polling cada 5 segundos
            return () => clearInterval(interval);
        }
    }, [user, isAdmin]);

    const saveGithubToken = (token: string) => {
        setGithubToken(token);
        localStorage.setItem('geeko_gh_token', token);
    };

    const triggerGithubSync = async () => {
        if (!githubToken) {
            alert("Por favor, introduce un Personal Access Token de GitHub.");
            return;
        }

        setIsTriggeringGit(true);
        try {
            const response = await fetch('https://api.github.com/repos/carloscedeno/TCG/dispatches', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${githubToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type: 'manual_sync_trigger'
                })
            });

            if (response.ok || response.status === 204) {
                setResults(prev => ({ ...prev, 'github-sync': { message: 'Workflow de GitHub disparado exitosamente!' } }));
            } else {
                const err = await response.json();
                setResults(prev => ({ ...prev, 'github-sync': { error: `GitHub error: ${err.message || response.statusText}` } }));
            }
        } catch (err: any) {
            setResults(prev => ({ ...prev, 'github-sync': { error: `Connection error: ${err.message}` } }));
        } finally {
            setIsTriggeringGit(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/tasks`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setActiveTasks(data);
            }
        } catch (err) {
            // Silencioso
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await response.json();
            if (!data.error) {
                setStats({
                    total_cards: data.total_cards.toLocaleString(),
                    total_users: data.total_users.toLocaleString(),
                    total_updates: data.total_updates.toLocaleString()
                });
            }
        } catch (err) {
            // Silencioso
        }
    };

    const runScraper = async (source: string) => {
        setRunning(prev => ({ ...prev, [source]: true }));
        try {
            const response = await fetch(`${API_BASE}/api/admin/scraper/run/${source}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await response.json();
            setResults(prev => ({ ...prev, [source]: data }));
            fetchStats();
        } catch (err) {
            console.error(err);
            setResults(prev => ({ ...prev, [source]: { error: 'Error de conexión' } }));
        } finally {
            setRunning(prev => ({ ...prev, [source]: false }));
        }
    };

    const runSync = async (gameCode: string) => {
        const id = `sync-${gameCode}`;
        setRunning(prev => ({ ...prev, [id]: true }));
        try {
            const response = await fetch(`${API_BASE}/api/admin/catalog/sync/${gameCode}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await response.json();
            setResults(prev => ({ ...prev, [id]: data }));
            if (data.task_id) {
                fetchTaskLogs(data.task_id);
            }
            fetchStats();
        } catch (err) {
            console.error(err);
            setResults(prev => ({ ...prev, [id]: { error: 'Error de conexión' } }));
        } finally {
            setRunning(prev => ({ ...prev, [id]: false }));
        }
    };

    const fetchTaskLogs = async (taskId: string) => {
        setIsRefreshingLogs(true);
        try {
            const response = await fetch(`${API_BASE}/api/admin/tasks/${taskId}/logs`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });
            const data = await response.json();
            setSelectedTaskLog({ id: taskId, logs: data.logs || 'Esperando output...' });
            setShowLogModal(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsRefreshingLogs(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-black italic">GEEKORIUM LOADING...</div>;

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">Acceso Denegado</h2>
                    <p className="text-slate-400 text-sm">Esta zona es exclusiva para administradores de Geekorium.</p>
                </div>
            </div>
        );
    }

    const scrapers = [
        { id: 'cardkingdom', name: 'CardKingdom', description: 'Market Reference (USD)', icon: <Database className="text-emerald-400" /> },
        { id: 'cardmarket', name: 'Cardmarket', description: 'Precios EU (EUR)', icon: <Database className="text-orange-400" /> },
        { id: 'tcgplayer', name: 'TCGPlayer', description: 'Precios US (USD)', icon: <Database className="text-blue-400" /> },
    ];

    const syncServices = [
        { id: 'MTG', name: 'Scryfall (MTG)', description: 'Catálogo Magic: The Gathering', icon: <Database className="text-red-400" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-geeko-cyan w-5 h-5" />
                            <span className="text-geeko-cyan font-black text-xs tracking-widest uppercase">Admin Terminal v1.0</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter italic">GEEKO<span className="text-geeko-cyan">SYSTEM</span></h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Connection</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard title="Usuarios Fleet" value={stats.total_users} change="Online" icon={<Users className="text-blue-400" />} />
                    <StatCard title="Deep Index" value={stats.total_cards} change="Nodes" icon={<Database className="text-purple-400" />} />
                    <StatCard title="Price Flux" value={stats.total_updates} change="Ops" icon={<Settings className="text-emerald-400" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
                                <Play className="text-geeko-cyan fill-geeko-cyan" />
                                EXECUTE SCRAPERS
                            </h2>
                            <div className="space-y-4">
                                {scrapers.map((scraper) => (
                                    <div key={scraper.id} className="bg-slate-800/20 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-geeko-cyan/30">
                                                {scraper.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg italic uppercase">{scraper.name}</h3>
                                                <p className="text-slate-500 text-xs font-bold">{scraper.description}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => runScraper(scraper.id)}
                                            disabled={running[scraper.id]}
                                            className="bg-geeko-cyan/20 border border-geeko-cyan/50 hover:bg-geeko-cyan/40 text-geeko-cyan px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            {running[scraper.id] ? 'Running...' : 'Deploy'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 italic text-purple-400">
                                <Database className="text-purple-400" />
                                CATALOG SYNC
                            </h2>
                            <div className="space-y-4">
                                {syncServices.map((service) => (
                                    <div key={service.id} className="bg-slate-800/20 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-purple-400/30">
                                                {service.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-lg italic uppercase">{service.name}</h3>
                                                <p className="text-slate-500 text-xs font-bold">{service.description}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => runSync(service.id)}
                                            disabled={running[`sync-${service.id}`]}
                                            className="bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/40 text-purple-400 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            {running[`sync-${service.id}`] ? 'Syncing...' : 'Start'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50">
                            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
                                <Shield className="text-emerald-400" />
                                MISSION CONTROL
                            </h2>
                            <div className="space-y-4 mb-6">
                                {activeTasks.length > 0 ? (
                                    activeTasks.map(task => (
                                        <div key={task.id} className="bg-slate-800/20 border border-white/5 rounded-2xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-xs text-slate-300 uppercase tracking-widest">{task.game_code} Task Runner</span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => fetchTaskLogs(task.id)} className="text-[10px] font-black uppercase text-blue-400 hover:underline">View Logs</button>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${task.status === 'running' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {task.status === 'running' && (
                                                <div className="w-full bg-black h-1 mt-2 rounded-full overflow-hidden">
                                                    <div className="bg-geeko-cyan h-full animate-pulse" style={{ width: '100%' }}></div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-slate-600 font-bold text-center py-6 bg-black/20 rounded-2xl border border-dashed border-white/5">
                                        NO ACTIVE RUNNERS
                                    </div>
                                )}
                            </div>
                            <div className="bg-black/60 rounded-2xl p-4 font-mono text-[10px] h-32 overflow-y-auto space-y-1 border border-white/5">
                                {Object.entries(results).map(([source, result], idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                        <span className="text-geeko-cyan">{source.toUpperCase()}:</span>
                                        <span className={result.error ? 'text-red-400' : 'text-emerald-400'}>
                                            {result.error || result.message || 'OK'}
                                        </span>
                                    </div>
                                ))}
                                {Object.keys(results).length === 0 && <div className="text-slate-700 italic">Console output initialized...</div>}
                            </div>
                        </div>

                        {/* Section: Webhooks & Automation */}
                        <div className="glass-card rounded-3xl p-8 border border-white/10 bg-black/40 border-dashed">
                            <h2 className="text-2xl font-black mb-4 flex items-center gap-3 italic">
                                <Settings className="text-geeko-cyan" />
                                GITHUB AUTOMATION
                            </h2>
                            <p className="text-slate-500 text-xs font-bold mb-6 italic">
                                Dispara la sincronización directamente en GitHub Actions.
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">GitHub Personal Access Token</div>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="password"
                                            value={githubToken}
                                            onChange={(e) => saveGithubToken(e.target.value)}
                                            placeholder="ghp_xxxxxxxxxxxx"
                                            className="bg-black/60 p-3 rounded-xl text-geeko-cyan text-[10px] flex-grow border border-white/5 focus:outline-none focus:border-geeko-cyan/50"
                                        />
                                    </div>
                                    <button
                                        onClick={triggerGithubSync}
                                        disabled={isTriggeringGit}
                                        className="w-full mt-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
                                    >
                                        {isTriggeringGit ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Disparando...
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={14} className="text-geeko-cyan" />
                                                Trigger Manual Sync (Actions)
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="p-4 bg-slate-900/30 rounded-2xl border border-white/5 text-[9px] text-slate-500 leading-relaxed font-bold">
                                    Pega tu PAT de GitHub arriba para habilitar el botón. El token se guarda localmente en tu navegador.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <button
                        onClick={() => window.location.href = './'}
                        className="text-slate-500 hover:text-geeko-cyan transition-all text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 group"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Deck
                    </button>
                </div>
            </div>

            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="glass-card border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                                <Shield className="text-geeko-cyan w-6 h-6" />
                                Logs // {selectedTaskLog?.id}
                            </h3>
                            <button onClick={() => setShowLogModal(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 bg-black/60 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap flex-grow custom-scrollbar">
                            {selectedTaskLog?.logs || 'Scanning for data...'}
                        </div>
                        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/5">
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">System Status: Active</span>
                            <button
                                onClick={() => selectedTaskLog && fetchTaskLogs(selectedTaskLog.id)}
                                disabled={isRefreshingLogs}
                                className="bg-geeko-cyan text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                            >
                                {isRefreshingLogs ? 'Updating...' : 'Refresh Logs'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) => (
    <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-900/50 hover:border-geeko-cyan/30 transition-all group">
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-geeko-cyan/10 transition-colors">
                {icon}
            </div>
            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{change}</span>
        </div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-4xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
);

const X = ({ size, className }: { size: number, className?: string }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
