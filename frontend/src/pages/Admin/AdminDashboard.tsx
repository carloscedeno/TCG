import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Play, Settings, Users, Database, Shield, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

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
            // Silencioso durante polling para evitar spam en consola cuando el servidor se reinicia por hot-reload
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
            // Silencioso durante polling
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Cargando...</div>;

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="bg-slate-900 border border-red-500/20 p-8 rounded-2xl max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
                    <p className="text-slate-400">No tienes permisos para acceder a esta área. Esta sección es exclusiva para administradores.</p>
                </div>
            </div>
        );
    }

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
            // Refresh stats after run
            fetchStats();
        } catch (err) {
            console.error(err);
            setResults(prev => ({ ...prev, [source]: { error: 'Error de conexión con el backend' } }));
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
                // Si arranca, abrimos los logs automáticamente para ver qué pasa
                fetchTaskLogs(data.task_id);
            }
            fetchStats();
        } catch (err) {
            console.error(err);
            setResults(prev => ({ ...prev, [id]: { error: 'Error de conexión con el backend' } }));
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
            setSelectedTaskLog({ id: taskId, logs: data.logs || '--- Esperando salida del proceso... ---' });
            setShowLogModal(true);
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setIsRefreshingLogs(false);
        }
    };

    const scrapers = [
        { id: 'cardmarket', name: 'Cardmarket', description: 'Scraper de precios para el mercado europeo (EUR)', icon: <Database className="text-orange-400" /> },
        { id: 'tcgplayer', name: 'TCGPlayer', description: 'Scraper de precios para el mercado americano (USD)', icon: <Database className="text-blue-400" /> },
    ];

    const syncServices = [
        { id: 'MTG', name: 'Scryfall (MTG)', description: 'Sincroniza catálogo completo de Magic', icon: <Database className="text-red-400" /> },
        { id: 'POKEMON', name: 'Pokemon API', description: 'Sincroniza cartas de Pokémon TCG', icon: <Database className="text-yellow-400" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-blue-500 w-5 h-5" />
                            <span className="text-blue-500 font-bold text-sm tracking-widest uppercase">Panel de Administración</span>
                        </div>
                        <h1 className="text-4xl font-black text-white">Gestión del Sistema</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-slate-300">Sistema Conectado</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard title="Total Usuarios" value={stats.total_users} change="Activos" icon={<Users className="text-blue-400" />} />
                    <StatCard title="Cartas Indexadas" value={stats.total_cards} change="En DB" icon={<Database className="text-purple-400" />} />
                    <StatCard title="Actualizaciones de Precios" value={stats.total_updates} change="Historial" icon={<Settings className="text-emerald-400" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        {/* Section: Controls Scrapers */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Play className="text-blue-500 fill-blue-500" />
                                Ejecutar Scrapers de Precios
                            </h2>
                            <div className="space-y-4">
                                {scrapers.map((scraper) => (
                                    <div key={scraper.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between hover:border-slate-600 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                                                {scraper.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{scraper.name}</h3>
                                                <p className="text-slate-500 text-sm">{scraper.description}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => runScraper(scraper.id)}
                                            disabled={running[scraper.id]}
                                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                                        >
                                            {running[scraper.id] ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Corriendo...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 fill-white" />
                                                    Ejecutar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Catalog Sync */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Database className="text-purple-500" />
                                Sincronización de Catálogo
                            </h2>
                            <div className="space-y-4">
                                {syncServices.map((service) => (
                                    <div key={service.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between hover:border-slate-600 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                                                {service.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">{service.name}</h3>
                                                <p className="text-slate-500 text-sm">{service.description}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => runSync(service.id)}
                                            disabled={running[`sync-${service.id}`]}
                                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                                        >
                                            {running[`sync-${service.id}`] ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    Sincronizando...
                                                </>
                                            ) : (
                                                <>
                                                    <Settings className="w-4 h-4" />
                                                    Sincronizar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section: Status & Logs */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Database className="text-purple-500" />
                            Estado de Procesos
                        </h2>

                        <div className="space-y-4 mb-6">
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <div key={task.id} className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-sm text-slate-300 uppercase tracking-wider">{task.game_code} Sync</span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => fetchTaskLogs(task.id)}
                                                    className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-slate-300 transition-colors"
                                                >
                                                    Ver Logs
                                                </button>
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${task.status === 'running' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                                                    task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500">ID: {task.id}</div>
                                        {task.status === 'running' && (
                                            <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
                                                <div className="bg-blue-500 h-full animate-progress" style={{ width: '100%' }}></div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-slate-600 italic text-sm text-center py-4 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                                    No hay procesos activos
                                </div>
                            )}
                        </div>

                        <div className="bg-black/40 rounded-2xl p-4 font-mono text-[11px] h-[250px] overflow-y-auto space-y-2 border border-slate-800">
                            <div className="text-slate-500 mb-2 border-b border-slate-800 pb-1">Historial de Comandos</div>
                            {Object.entries(results).map(([source, result], idx) => (
                                <div key={idx} className="pb-2 last:border-0">
                                    <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
                                    <span className="text-blue-400 ml-2 uppercase font-bold text-[9px]">{source}:</span>
                                    <span className="text-slate-300 ml-2">
                                        {result.error ? (
                                            <span className="text-red-400">Error: {result.error}</span>
                                        ) : (
                                            <span className="text-emerald-400">{result.message || 'Ok'}</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                            {Object.keys(results).length === 0 && (
                                <div className="text-slate-700 italic">Consola de administración lista...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Added a back button to exit admin */}
            <div className="max-w-6xl mx-auto mt-8 flex justify-center">
                <button
                    onClick={() => window.location.href = '/TCG/'}
                    className="text-slate-500 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                    Volver a la Tienda
                </button>
            </div>

            {/* Log Modal */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="text-blue-500 w-5 h-5" />
                                Salida del Proceso: {selectedTaskLog?.id}
                            </h3>
                            <button
                                onClick={() => setShowLogModal(false)}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                            </button>
                        </div>
                        <div className="p-6 bg-black/40 overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap flex-grow">
                            {selectedTaskLog?.logs || 'No hay logs aún...'}
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => selectedTaskLog && fetchTaskLogs(selectedTaskLog.id)}
                                disabled={isRefreshingLogs}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2"
                            >
                                {isRefreshingLogs ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Actualizando...
                                    </>
                                ) : 'Actualizar Logs'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) => (
    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <span className="text-emerald-500 text-xs font-bold leading-none">{change}</span>
        </div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-black text-white">{value}</p>
    </div>
);
