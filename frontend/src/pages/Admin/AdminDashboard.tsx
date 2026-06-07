import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Play, Settings, Users, Database, Shield, AlertCircle, Package, ExternalLink, Image, Calendar, TrendingUp, Upload, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';

import { supabase } from '../../utils/supabaseClient';
import { CloudflareAnalytics } from '../../components/Admin/CloudflareAnalytics';
import { PriceUpdateHistory } from '../../components/Admin/PriceUpdateHistory';

const API_BASE = import.meta.env.VITE_API_BASE;

export const AdminDashboard = () => {
    const { user, session, isAdmin, loading } = useAuth();
    const [running, setRunning] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, any>>({});
    const [stats, setStats] = useState({
        total_cards: '0',
        total_products: '0',
        total_orders_week: '0',
        effective_orders: '0',
        failed_orders: '0',
        total_users: '0',
        last_sync_date: null as string | null
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

            // Only poll stats occasionally
            const interval = setInterval(() => {
                fetchTasks();
                fetchStats();
            }, 30000);
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
                setResults(prev => ({ ...prev, 'github-sync': { message: '¡Flujo de trabajo de GitHub iniciado exitosamente!' } }));
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
        } catch {
            // Silencioso
        }
    };

    const fetchStats = async () => {
        try {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            const lastWeekISO = lastWeek.toISOString();

            const [cards, products, ordersWeek, effectiveOrders, failedOrders, users, lastSync] = await Promise.all([
                supabase.from('products').select('*', { count: 'estimated', head: true }),
                supabase.from('accessories').select('*', { count: 'estimated', head: true }),
                supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', lastWeekISO),
                supabase.from('orders').select('*', { count: 'exact', head: true })
                    .gte('created_at', lastWeekISO)
                    .in('status', ['paid', 'processing', 'ready_for_pickup', 'shipped', 'delivered']),
                supabase.from('orders').select('*', { count: 'exact', head: true })
                    .gte('created_at', lastWeekISO)
                    .in('status', ['cancelled', 'returned', 'refunded']),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('card_printings')
                    .select('updated_at')
                    .not('updated_at', 'is', null)
                    .neq('printing_id', Date.now().toString()) // Anti-cache mechanism
                    .order('updated_at', { ascending: false })
                    .limit(1)
            ]);

            setStats({
                total_cards: (cards.count || 0).toLocaleString(),
                total_products: (products.count || 0).toLocaleString(),
                total_orders_week: (ordersWeek.count || 0).toLocaleString(),
                effective_orders: (effectiveOrders.count || 0).toLocaleString(),
                failed_orders: (failedOrders.count || 0).toLocaleString(),
                total_users: (users.count || 0).toLocaleString(),
                last_sync_date: lastSync.data?.[0]?.updated_at || null
            });
        } catch (err) {
            console.error("Error fetching stats:", err);
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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-black italic">GEEKORIUM CARGANDO...</div>;

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
        { id: 'cardkingdom', name: 'CardKingdom', description: 'Referencia de Mercado (USD)', icon: <Database className="text-white" /> },
        { id: 'cardmarket', name: 'Cardmarket', description: 'Precios UE (EUR)', icon: <Database className="text-orange-400" /> },
        { id: 'tcgplayer', name: 'TCGPlayer', description: 'Precios EE.UU. (USD)', icon: <Database className="text-blue-400" /> },
    ];

    const syncServices = [
        { id: 'MTG', name: 'Scryfall (MTG)', description: 'Catálogo Magic: The Gathering', icon: <Database className="text-red-400" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex-shrink-0 group relative">
                            <img src="/branding/Logo.png" alt="Geekorium" className="w-32 sm:w-40 object-contain group-hover:scale-105 transition-transform" />
                        </Link>
                        <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="text-[#00D1FF] w-4 h-4" />
                                <span className="text-[#00D1FF] font-black text-[10px] tracking-widest uppercase">Admin Terminal v1.0</span>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tighter italic leading-none">GEEKO<span className="text-white/50">SYSTEM</span></h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a la Tienda
                        </Link>
                        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl hidden sm:flex items-center gap-3 shadow-lg">
                            <div className="w-2 h-2 bg-[#00FF85] rounded-full animate-pulse shadow-[0_0_8px_#00FF85]"></div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Conexión Activa</span>
                        </div>
                    </div>
                </div>

                {(() => {
                    if (!stats.last_sync_date) return null;
                    const hoursSinceSync = (new Date().getTime() - new Date(stats.last_sync_date).getTime()) / (1000 * 60 * 60);
                    const isHealthy = hoursSinceSync < 24;
                    return (
                        <div className={`mb-8 p-6 rounded-2xl border flex items-center justify-between gap-4 ${isHealthy ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-red-950/30 border-red-500/20'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                                <div>
                                    <h3 className={`font-black text-sm uppercase tracking-widest ${isHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isHealthy ? 'Catálogo Sincronizado' : 'Sincronización Retrasada'}
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">
                                        Última actualización de precios: {new Date(stats.last_sync_date).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {!isHealthy && (
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                    Requiere Atención
                                </span>
                            )}
                        </div>
                    );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <StatCard title="Cartas en Inventario" value={stats.total_cards} change="Singles" icon={<Database className="text-purple-400" />} />
                    <StatCard title="Productos en Inventario" value={stats.total_products} change="Sellado" icon={<ShoppingBag className="text-[#00FF85]" />} />
                    <StatCard title="Pedidos última semana" value={stats.total_orders_week} change="Total 7d" icon={<Package className="text-[#00D1FF]" />} />
                    <StatCard title="Pedidos Efectivos" value={stats.effective_orders} change="Completados" icon={<CheckCircle className="text-emerald-400" />} />
                    <StatCard title="Pedidos Fallidos" value={stats.failed_orders} change="Rechazados" icon={<XCircle className="text-rose-500" />} />
                    <StatCard title="Usuarios Activos" value={stats.total_users} change="Global" icon={<Users className="text-blue-400" />} />
                </div>

                <div className="mb-12">
                    <Link to="/admin/customers" className="group block relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-white/20 p-10 hover:border-white/50 transition-all shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                                        <Users className="text-white" size={24} />
                                    </div>
                                    <span className="text-white font-black text-xs tracking-[0.3em] uppercase">Módulo de Punto de Venta</span>
                                </div>
                                <h2 className="text-4xl font-black italic text-white tracking-tighter mb-4 leading-none">PORTAL DE <span className="text-white">ATENCIÓN A CLIENTES</span></h2>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest max-w-xl">Gestiona carritos múltiples, atiende clientes en tienda y procesa ventas rápidas de forma centralizada.</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Estado del Sistema</span>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">Terminal Operativa</span>
                                    </div>
                                </div>
                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform group-hover:rotate-6">
                                    <ExternalLink size={32} className="text-black" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <Link to="/admin/inventory" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/50 to-slate-900 border border-white/10 p-8 hover:border-purple-500/50 transition-all">
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">CONSOLA DE INVENTARIO</h3>
                                <p className="text-purple-300 text-xs font-bold uppercase tracking-widest">Gestionar Stock y Precios</p>
                            </div>
                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="text-purple-400" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/orders" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/30 to-slate-900 border border-white/10 p-8 hover:border-white/50 transition-all">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">TERMINAL DE ÓRDENES</h3>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Procesar y Cancelar Órdenes</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="text-white" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/catalog" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-900/50 to-slate-900 border border-white/10 p-8 hover:border-orange-500/50 transition-all md:col-span-2">
                        <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">CATÁLOGO DE TIENDA</h3>
                                <p className="text-orange-300 text-xs font-bold uppercase tracking-widest">Gestionar Sellado, Accesorios y Otros</p>
                            </div>
                            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="text-orange-400" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/categories" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00D1FF]/30 to-slate-900 border border-white/10 p-8 hover:border-[#00D1FF]/50 transition-all md:col-span-1">
                        <div className="absolute inset-0 bg-[#00D1FF]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">CATEGORÍAS</h3>
                                <p className="text-[#00D1FF] text-xs font-bold uppercase tracking-widest">Taxonomía del Catálogo</p>
                            </div>
                            <div className="w-16 h-16 bg-[#00D1FF]/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Database className="text-[#00D1FF]" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/media" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-white/10 p-8 hover:border-indigo-500/50 transition-all md:col-span-2">
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">GALERÍA MULTIMEDIA</h3>
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Gestionar Imágenes y Archivos</p>
                            </div>
                            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Image className="text-indigo-400" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/banners" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-900/50 to-slate-900 border border-white/10 p-8 hover:border-cyan-500/50 transition-all">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">BANNERS HOME</h3>
                                <p className="text-cyan-300 text-xs font-bold uppercase tracking-widest">Gestionar Carrusel Principal</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Image className="text-white" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/banners-tcg" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-geeko-purple/40 to-slate-900 border border-white/10 p-8 hover:border-geeko-purple/50 transition-all">
                        <div className="absolute inset-0 bg-geeko-purple/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">BANNERS TCG</h3>
                                <p className="text-geeko-purple text-xs font-bold uppercase tracking-widest">Gestionar Carrusel por Juego</p>
                            </div>
                            <div className="w-16 h-16 bg-geeko-purple/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Image className="text-geeko-purple" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/events" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-900/50 to-slate-900 border border-white/10 p-8 hover:border-rose-500/50 transition-all">
                        <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">EVENTOS</h3>
                                <p className="text-rose-300 text-xs font-bold uppercase tracking-widest">Calendario y Torneos</p>
                            </div>
                            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Calendar className="text-rose-400" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/admin/presales" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-white/10 p-8 hover:border-white/50 transition-all">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">PREVENTAS</h3>
                                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest">Anuncios de Preventa</p>
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="text-white" size={32} />
                            </div>
                        </div>
                    </Link>

                    <Link to="/import" className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-8 hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black italic text-white mb-2">IMPORTAR</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Carga Masiva de Colección</p>
                            </div>
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="text-slate-300" size={32} />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mb-12">
                    <PriceUpdateHistory />
                </div>

                <div className="mb-12">
                    <CloudflareAnalytics session={session} apiBase={API_BASE} />
                </div>

                {(() => false)() && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50">
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
                                    <Play className="text-white fill-white" />
                                    EJECUTAR SCRAPERS
                                </h2>
                                <div className="space-y-4">
                                    {scrapers.map((scraper) => (
                                        <div key={scraper.id} className="bg-slate-800/20 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-white/30">
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
                                                className="bg-white/20 border border-white/50 hover:bg-white/40 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                            >
                                                {running[scraper.id] ? 'Ejecutando...' : 'Desplegar'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50">
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 italic text-geeko-purple">
                                    <Database className="text-geeko-purple" />
                                    SINCRONIZACIÓN DE CATÁLOGO
                                </h2>
                                <div className="space-y-4">
                                    {syncServices.map((service) => (
                                        <div key={service.id} className="bg-slate-800/20 border border-white/5 rounded-2xl p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-geeko-purple/30">
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
                                                className="bg-geeko-purple/20 border border-geeko-purple/50 hover:bg-geeko-purple/40 text-geeko-purple px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                            >
                                                {running[`sync-${service.id}`] ? 'Sincronizando...' : 'Iniciar'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="glass-card rounded-3xl p-8 border border-white/5 bg-slate-900/50">
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
                                    <Shield className="text-white" />
                                    CONTROL DE MISIÓN
                                </h2>
                                <div className="space-y-4 mb-6">
                                    {activeTasks.length > 0 ? (
                                        activeTasks.map(task => (
                                            <div key={task.id} className="bg-slate-800/20 border border-white/5 rounded-2xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-black text-xs text-slate-300 uppercase tracking-widest">{task.game_code} Ejecutor de Tareas</span>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => fetchTaskLogs(task.id)} className="text-[10px] font-black uppercase text-white hover:underline">Ver Logs</button>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${task.status === 'running' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {task.status === 'running' && (
                                                    <div className="w-full bg-black h-1 mt-2 rounded-full overflow-hidden">
                                                        <div className="bg-white h-full animate-pulse" style={{ width: '100%' }}></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-600 font-bold text-center py-6 bg-black/20 rounded-2xl border border-dashed border-white/5">
                                            NO HAY TAREAS ACTIVAS
                                        </div>
                                    )}
                                </div>
                                <div className="bg-black/60 rounded-2xl p-4 font-mono text-[10px] h-32 overflow-y-auto space-y-1 border border-white/5">
                                    {Object.entries(results).map(([source, result], idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                            <span className="text-white">{source.toUpperCase()}:</span>
                                            <span className={result.error ? 'text-red-400' : 'text-white'}>
                                                {result.error || result.message || 'OK'}
                                            </span>
                                        </div>
                                    ))}
                                    {Object.keys(results).length === 0 && <div className="text-slate-700 italic">Salida de consola inicializada...</div>}
                                </div>
                            </div>

                            {/* Section: Webhooks & Automation */}
                            <div className="glass-card rounded-3xl p-8 border border-white/10 bg-black/40 border-dashed">
                                <h2 className="text-2xl font-black mb-4 flex items-center gap-3 italic">
                                    <Settings className="text-white" />
                                    AUTOMATIZACIÓN GITHUB
                                </h2>
                                <p className="text-slate-500 text-xs font-bold mb-6 italic">
                                    Dispara la sincronización directamente en GitHub Actions.
                                </p>

                                <div className="space-y-4">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Token de Acceso Personal de GitHub</div>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="password"
                                                value={githubToken}
                                                onChange={(e) => saveGithubToken(e.target.value)}
                                                placeholder="ghp_xxxxxxxxxxxx"
                                                className="bg-black/60 p-3 rounded-xl text-white text-[10px] flex-grow border border-white/5 focus:outline-none focus:border-white/50"
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
                                                    Iniciando...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield size={14} className="text-white" />
                                                    Activar Sincronización Manual (Actions)
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
                )}
            </div>

            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="glass-card border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <h3 className="text-xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                                <Shield className="text-white w-6 h-6" />
                                Registros // {selectedTaskLog?.id}
                            </h3>
                            <button onClick={() => setShowLogModal(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 bg-black/60 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap flex-grow custom-scrollbar">
                            {selectedTaskLog?.logs || 'Escaneando datos...'}
                        </div>
                        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/5">
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Estado del Sistema: Activo</span>
                            <button
                                onClick={() => selectedTaskLog && fetchTaskLogs(selectedTaskLog.id)}
                                disabled={isRefreshingLogs}
                                className="bg-white text-black px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                            >
                                {isRefreshingLogs ? 'Actualizando...' : 'Actualizar Registros'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) => (
    <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-slate-900/50 hover:border-white/30 transition-all group">
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/20">{change}</span>
        </div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-4xl font-black text-white italic tracking-tighter">{value}</p>
    </div>
);

const X = ({ size, className }: { size: number, className?: string }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
