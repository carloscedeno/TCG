import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Plus, Save, Trash2, ArrowLeft, History, Users, Shield, Award } from 'lucide-react';
import type { RankingSeason } from '../../pages/Admin/AdminRankingsPage';
import { PlayerHistoryModal } from './PlayerHistoryModal';

interface PlayerRanking {
    id: string;
    season_id: string;
    category_id: string | null;
    tier_id: string | null;
    name: string;
    faction: string | null;
    conquest_points: number;
    takedown_points: number;
    confirmed_kills: number;
    points: number;
    player_photo_url: string | null;
    user_id: string | null;
}

interface RankingCategory {
    id: string;
    season_id: string;
    parent_id: string | null;
    name: string;
    description: string | null;
    image_url: string | null;
    created_at: string;
}

interface RankingTier {
    id: string;
    season_id: string;
    name: string;
    order_index: number;
    image_url: string | null;
    created_at: string;
}

interface RankingSeasonManagerProps {
    season: RankingSeason;
    onBack: () => void;
}

const RankingSeasonManager = ({ season, onBack }: RankingSeasonManagerProps) => {
    const [activeTab, setActiveTab] = useState<'players' | 'categories' | 'tiers'>('players');
    
    const [players, setPlayers] = useState<PlayerRanking[]>([]);
    const [categories, setCategories] = useState<RankingCategory[]>([]);
    const [tiers, setTiers] = useState<RankingTier[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    
    const [isAddingPlayer, setIsAddingPlayer] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState<Partial<RankingCategory>>({ name: '', description: '', image_url: '', parent_id: '' });
    
    const [isAddingTier, setIsAddingTier] = useState(false);
    const [newTier, setNewTier] = useState<Partial<RankingTier>>({ name: '', order_index: 1, image_url: '' });

    const [historyPlayer, setHistoryPlayer] = useState<{id: string, name: string} | null>(null);

    const isGundam = season.game_context === 'GND';

    useEffect(() => {
        fetchData();
    }, [season.id]);

    const fetchData = async () => {
        setLoading(true);
        const [playersRes, categoriesRes, tiersRes] = await Promise.all([
            supabase.from('player_rankings').select('*').eq('season_id', season.id).order('points', { ascending: false }).order('confirmed_kills', { ascending: false }),
            supabase.from('ranking_categories').select('*').eq('season_id', season.id).order('name'),
            supabase.from('ranking_tiers').select('*').eq('season_id', season.id).order('order_index')
        ]);

        if (playersRes.data) setPlayers(playersRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (tiersRes.data) setTiers(tiersRes.data);
        
        setLoading(false);
    };

    // --- PLAYERS LOGIC ---
    const submitNewPlayer = async () => {
        if (!newPlayerName.trim()) { setIsAddingPlayer(false); return; }
        const { data, error } = await supabase.from('player_rankings')
            .insert([{ season_id: season.id, name: newPlayerName.trim(), faction: isGundam ? 'ZEON' : null, conquest_points: 0, takedown_points: 0, confirmed_kills: 0, points: 0 }])
            .select().single();

        if (error) alert('Error al añadir: ' + error.message);
        else if (data) {
            setPlayers([...players, data].sort((a, b) => b.points - a.points));
            setNewPlayerName('');
            setIsAddingPlayer(false);
        }
    };

    const handleUpdatePlayer = async (id: string, updates: Partial<PlayerRanking>) => {
        setSavingId(id);
        
        // Handle empty strings for UUIDs (turn into null)
        const cleanUpdates = { ...updates };
        if (cleanUpdates.category_id === '') cleanUpdates.category_id = null;
        if (cleanUpdates.tier_id === '') cleanUpdates.tier_id = null;

        const { error } = await supabase.from('player_rankings').update(cleanUpdates).eq('id', id);
        if (error) alert('Error al actualizar: ' + error.message);
        else setPlayers(current => current.map(p => p.id === id ? { ...p, ...cleanUpdates } : p).sort((a, b) => b.points - a.points));
        setSavingId(null);
    };

    const handleDeletePlayer = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar a este jugador de la temporada?')) return;
        const { error } = await supabase.from('player_rankings').delete().eq('id', id);
        if (!error) setPlayers(current => current.filter(p => p.id !== id));
        else alert('Error: ' + error.message);
    };

    // --- CATEGORIES LOGIC ---
    const submitNewCategory = async () => {
        if (!newCategory.name?.trim()) { setIsAddingCategory(false); return; }
        const cleanParent = newCategory.parent_id === '' ? null : newCategory.parent_id;
        const { data, error } = await supabase.from('ranking_categories')
            .insert([{ season_id: season.id, name: newCategory.name.trim(), description: newCategory.description, image_url: newCategory.image_url, parent_id: cleanParent }])
            .select().single();

        if (error) alert('Error: ' + error.message);
        else if (data) {
            setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCategory({ name: '', description: '', image_url: '', parent_id: '' });
            setIsAddingCategory(false);
        }
    };

    const handleUpdateCategory = async (id: string, updates: Partial<RankingCategory>) => {
        setSavingId(id);
        const cleanUpdates = { ...updates };
        if (cleanUpdates.parent_id === '') cleanUpdates.parent_id = null;
        
        const { error } = await supabase.from('ranking_categories').update(cleanUpdates).eq('id', id);
        if (error) alert('Error: ' + error.message);
        else setCategories(current => current.map(c => c.id === id ? { ...c, ...cleanUpdates } : c));
        setSavingId(null);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('¿Seguro? Si tiene jugadores, se quedarán sin categoría (Null).')) return;
        const { error } = await supabase.from('ranking_categories').delete().eq('id', id);
        if (!error) setCategories(current => current.filter(c => c.id !== id));
        else alert('Error: ' + error.message);
    };

    // --- TIERS LOGIC ---
    const submitNewTier = async () => {
        if (!newTier.name?.trim()) { setIsAddingTier(false); return; }
        const { data, error } = await supabase.from('ranking_tiers')
            .insert([{ season_id: season.id, name: newTier.name.trim(), order_index: newTier.order_index, image_url: newTier.image_url }])
            .select().single();

        if (error) alert('Error: ' + error.message);
        else if (data) {
            setTiers([...tiers, data].sort((a, b) => a.order_index - b.order_index));
            setNewTier({ name: '', order_index: (newTier.order_index || 1) + 1, image_url: '' });
            setIsAddingTier(false);
        }
    };

    const handleUpdateTier = async (id: string, updates: Partial<RankingTier>) => {
        setSavingId(id);
        const { error } = await supabase.from('ranking_tiers').update(updates).eq('id', id);
        if (error) alert('Error: ' + error.message);
        else setTiers(current => current.map(t => t.id === id ? { ...t, ...updates } : t).sort((a, b) => a.order_index - b.order_index));
        setSavingId(null);
    };

    const handleDeleteTier = async (id: string) => {
        if (!confirm('¿Seguro? Si hay jugadores con este rango, quedarán sin rango (Null).')) return;
        const { error } = await supabase.from('ranking_tiers').delete().eq('id', id);
        if (!error) setTiers(current => current.filter(t => t.id !== id));
        else alert('Error: ' + error.message);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-6">
                    <div>
                        <button onClick={onBack} className="text-[#00D1FF] hover:text-white flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest transition-colors">
                            <ArrowLeft size={16} /> Volver a Temporadas
                        </button>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">{season.title}</h2>
                        <p className="text-slate-400 font-mono text-sm">{season.subtitle} • Juego: {season.game_context}</p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex space-x-2 mb-8 bg-slate-900/50 p-2 rounded-2xl border border-white/5 w-fit">
                    <button 
                        onClick={() => setActiveTab('players')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'players' ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={16} /> Jugadores
                    </button>
                    <button 
                        onClick={() => setActiveTab('categories')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'categories' ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Shield size={16} /> Facciones / Equipos
                    </button>
                    <button 
                        onClick={() => setActiveTab('tiers')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${activeTab === 'tiers' ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Award size={16} /> Rangos
                    </button>
                </div>

                {/* TAB: PLAYERS */}
                {activeTab === 'players' && (
                    <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden bg-slate-900/50 shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-end">
                            <button onClick={() => setIsAddingPlayer(true)} className="bg-[#00FF85] text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                                <Plus size={14} /> Añadir Jugador
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] uppercase text-slate-500 tracking-widest bg-black/40 border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-4 font-black">Jugador</th>
                                        {isGundam ? (
                                            <>
                                                <th className="px-4 py-4 font-black">Facción (String)</th>
                                                <th className="px-4 py-4 font-black">Conquista</th>
                                                <th className="px-4 py-4 font-black">Derribo</th>
                                                <th className="px-4 py-4 font-black">Kills</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-4 py-4 font-black">Equipo/Categoría</th>
                                                <th className="px-4 py-4 font-black">Puntos</th>
                                                <th className="px-4 py-4 font-black">Rango (Tier)</th>
                                            </>
                                        )}
                                        <th className="px-4 py-4 font-black text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {loading ? (
                                        <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold italic">Cargando...</td></tr>
                                    ) : (
                                        <>
                                            {isAddingPlayer && (
                                                <tr className="bg-[#00FF85]/5 border-b border-[#00FF85]/20">
                                                    <td className="px-4 py-4">
                                                        <input autoFocus type="text" placeholder="Nombre" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submitNewPlayer(); if (e.key === 'Escape') setIsAddingPlayer(false); }} className="bg-black/50 border border-[#00FF85]/50 rounded px-2 py-1 w-full focus:border-[#00FF85] outline-none text-[#00FF85]" />
                                                    </td>
                                                    <td colSpan={isGundam ? 4 : 3} className="px-4 py-4 text-slate-500 text-xs italic">Presiona Enter para guardar</td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button onClick={submitNewPlayer} className="p-2 bg-[#00FF85]/20 text-[#00FF85] rounded-lg"><Save size={16} /></button>
                                                    </td>
                                                </tr>
                                            )}
                                            {players.map(player => (
                                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <input type="text" defaultValue={player.name} onBlur={e => { if (e.target.value !== player.name) handleUpdatePlayer(player.id, { name: e.target.value }); }} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full focus:border-[#00D1FF] outline-none text-white font-bold" />
                                                    </td>
                                                    {isGundam ? (
                                                        <>
                                                            <td className="px-4 py-4">
                                                                <select defaultValue={player.faction || 'ZEON'} onBlur={e => { if (e.target.value !== player.faction) handleUpdatePlayer(player.id, { faction: e.target.value }); }} className="bg-black/30 border border-white/10 rounded px-2 py-1 focus:border-[#00D1FF] outline-none">
                                                                    <option value="ZEON">Zeon</option>
                                                                    <option value="EARTH_FEDERATION">Earth Federation</option>
                                                                    <option value="OTRA">Otra</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-4"><input type="number" defaultValue={player.conquest_points} onBlur={e => handleUpdatePlayer(player.id, { conquest_points: parseInt(e.target.value)||0 })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-16 text-center" /></td>
                                                            <td className="px-4 py-4"><input type="number" defaultValue={player.takedown_points} onBlur={e => handleUpdatePlayer(player.id, { takedown_points: parseInt(e.target.value)||0 })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-16 text-center" /></td>
                                                            <td className="px-4 py-4"><input type="number" defaultValue={player.confirmed_kills} onBlur={e => handleUpdatePlayer(player.id, { confirmed_kills: parseInt(e.target.value)||0 })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-16 text-center font-bold text-[#00FF85]" /></td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-4">
                                                                <select defaultValue={player.category_id || ''} onBlur={e => handleUpdatePlayer(player.id, { category_id: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 focus:border-[#00D1FF] outline-none w-full text-xs">
                                                                    <option value="">-- Sin Equipo --</option>
                                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-4"><input type="number" defaultValue={player.points} onBlur={e => handleUpdatePlayer(player.id, { points: parseInt(e.target.value)||0 })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-20 text-center font-bold text-[#00D1FF]" /></td>
                                                            <td className="px-4 py-4">
                                                                <select defaultValue={player.tier_id || ''} onBlur={e => handleUpdatePlayer(player.id, { tier_id: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 focus:border-[#00D1FF] outline-none w-full text-xs">
                                                                    <option value="">-- Sin Rango --</option>
                                                                    {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                                </select>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-4 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {savingId === player.id ? <span className="text-[#00FF85] animate-pulse"><Save size={16} /></span> : (
                                                                <>
                                                                    <button onClick={() => setHistoryPlayer({ id: player.id, name: player.name })} className="p-2 bg-[#00D1FF]/10 hover:bg-[#00D1FF]/20 text-[#00D1FF] rounded-lg" title="Historial"><History size={16} /></button>
                                                                    <button onClick={() => handleDeletePlayer(player.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"><Trash2 size={16} /></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden bg-slate-900/50 shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-slate-300">Equipos y Facciones de la Temporada</h3>
                            <button onClick={() => setIsAddingCategory(true)} className="bg-[#00FF85] text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                                <Plus size={14} /> Crear Equipo
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] uppercase text-slate-500 tracking-widest bg-black/40 border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-4 font-black">Nombre</th>
                                        <th className="px-4 py-4 font-black">Padre (Jerarquía)</th>
                                        <th className="px-4 py-4 font-black">Descripción</th>
                                        <th className="px-4 py-4 font-black">Imagen URL</th>
                                        <th className="px-4 py-4 font-black text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {isAddingCategory && (
                                        <tr className="bg-[#00FF85]/5 border-b border-[#00FF85]/20">
                                            <td className="px-4 py-4"><input autoFocus type="text" placeholder="Ej: Dragones de Tarkir" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="bg-black/50 border border-[#00FF85]/50 rounded px-2 py-1 w-full text-[#00FF85] outline-none" /></td>
                                            <td className="px-4 py-4">
                                                <select value={newCategory.parent_id || ''} onChange={e => setNewCategory({...newCategory, parent_id: e.target.value})} className="bg-black/50 border border-white/10 rounded px-2 py-1 w-full text-white outline-none text-xs">
                                                    <option value="">-- Sin Padre (Principal) --</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4"><input type="text" placeholder="Descripción corta" value={newCategory.description || ''} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="bg-black/50 border border-white/10 rounded px-2 py-1 w-full text-white outline-none text-xs" /></td>
                                            <td className="px-4 py-4"><input type="text" placeholder="https://" value={newCategory.image_url || ''} onChange={e => setNewCategory({...newCategory, image_url: e.target.value})} className="bg-black/50 border border-white/10 rounded px-2 py-1 w-full text-white outline-none text-xs" /></td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={submitNewCategory} className="p-2 bg-[#00FF85]/20 text-[#00FF85] rounded-lg"><Save size={16} /></button>
                                                    <button onClick={() => setIsAddingCategory(false)} className="p-2 bg-slate-500/20 text-slate-400 rounded-lg">✕</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {categories.map(cat => (
                                        <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4"><input type="text" defaultValue={cat.name} onBlur={e => handleUpdateCategory(cat.id, { name: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full outline-none focus:border-[#00D1FF]" /></td>
                                            <td className="px-4 py-4">
                                                <select defaultValue={cat.parent_id || ''} onBlur={e => handleUpdateCategory(cat.id, { parent_id: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full outline-none focus:border-[#00D1FF] text-xs">
                                                    <option value="">-- Raíz --</option>
                                                    {categories.filter(c => c.id !== cat.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-4"><input type="text" defaultValue={cat.description || ''} onBlur={e => handleUpdateCategory(cat.id, { description: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full outline-none text-xs" /></td>
                                            <td className="px-4 py-4"><input type="text" defaultValue={cat.image_url || ''} onBlur={e => handleUpdateCategory(cat.id, { image_url: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full outline-none text-xs" /></td>
                                            <td className="px-4 py-4 text-right">
                                                {savingId === cat.id ? <span className="text-[#00FF85] animate-pulse inline-block p-2"><Save size={16} /></span> : (
                                                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"><Trash2 size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && !isAddingCategory && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No hay equipos creados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: TIERS */}
                {activeTab === 'tiers' && (
                    <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden bg-slate-900/50 shadow-2xl">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <h3 className="font-bold text-slate-300">Rangos Disponibles</h3>
                            <button onClick={() => setIsAddingTier(true)} className="bg-[#00FF85] text-black px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                                <Plus size={14} /> Crear Rango
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-[10px] uppercase text-slate-500 tracking-widest bg-black/40 border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-4 font-black">Orden (Numérico)</th>
                                        <th className="px-4 py-4 font-black">Nombre del Rango</th>
                                        <th className="px-4 py-4 font-black">Icono URL</th>
                                        <th className="px-4 py-4 font-black text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-300">
                                    {isAddingTier && (
                                        <tr className="bg-[#00FF85]/5 border-b border-[#00FF85]/20">
                                            <td className="px-4 py-4"><input type="number" value={newTier.order_index} onChange={e => setNewTier({...newTier, order_index: parseInt(e.target.value)||1})} className="bg-black/50 border border-[#00FF85]/50 rounded px-2 py-1 w-20 text-center text-[#00FF85] outline-none" /></td>
                                            <td className="px-4 py-4"><input autoFocus type="text" placeholder="Ej: Maestro" value={newTier.name} onChange={e => setNewTier({...newTier, name: e.target.value})} className="bg-black/50 border border-[#00FF85]/50 rounded px-2 py-1 w-full text-[#00FF85] outline-none" /></td>
                                            <td className="px-4 py-4"><input type="text" placeholder="https://" value={newTier.image_url || ''} onChange={e => setNewTier({...newTier, image_url: e.target.value})} className="bg-black/50 border border-white/10 rounded px-2 py-1 w-full text-white outline-none text-xs" /></td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={submitNewTier} className="p-2 bg-[#00FF85]/20 text-[#00FF85] rounded-lg"><Save size={16} /></button>
                                                    <button onClick={() => setIsAddingTier(false)} className="p-2 bg-slate-500/20 text-slate-400 rounded-lg">✕</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {tiers.map(tier => (
                                        <tr key={tier.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4"><input type="number" defaultValue={tier.order_index} onBlur={e => handleUpdateTier(tier.id, { order_index: parseInt(e.target.value)||1 })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-20 text-center outline-none focus:border-[#00D1FF] font-bold" /></td>
                                            <td className="px-4 py-4"><input type="text" defaultValue={tier.name} onBlur={e => handleUpdateTier(tier.id, { name: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full outline-none focus:border-[#00D1FF]" /></td>
                                            <td className="px-4 py-4"><input type="text" defaultValue={tier.image_url || ''} onBlur={e => handleUpdateTier(tier.id, { image_url: e.target.value })} className="bg-black/30 border border-white/10 rounded px-2 py-1 w-full outline-none text-xs focus:border-[#00D1FF]" /></td>
                                            <td className="px-4 py-4 text-right">
                                                {savingId === tier.id ? <span className="text-[#00FF85] animate-pulse inline-block p-2"><Save size={16} /></span> : (
                                                    <button onClick={() => handleDeleteTier(tier.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"><Trash2 size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {tiers.length === 0 && !isAddingTier && (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No hay rangos creados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            {historyPlayer && (
                <PlayerHistoryModal playerId={historyPlayer.id} playerName={historyPlayer.name} onClose={() => setHistoryPlayer(null)} />
            )}
        </div>
    );
};

export default RankingSeasonManager;
