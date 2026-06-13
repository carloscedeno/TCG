import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Plus, Save, Trash2, ArrowLeft } from 'lucide-react';
import type { RankingSeason } from '../../pages/Admin/AdminRankingsPage';

interface PlayerRanking {
    id: string;
    season_id: string;
    name: string;
    points: number;
    player_photo_url: string | null;
    game_asset_url: string | null;
    tier_icon: string | null;
    user_id: string | null;
}

interface RankingSeasonManagerProps {
    season: RankingSeason;
    onBack: () => void;
}

const RankingSeasonManager = ({ season, onBack }: RankingSeasonManagerProps) => {
    const [players, setPlayers] = useState<PlayerRanking[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        fetchPlayers();
    }, [season.id]);

    const fetchPlayers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('player_rankings')
            .select('*')
            .eq('season_id', season.id)
            .order('points', { ascending: false });

        if (!error && data) {
            setPlayers(data);
        }
        setLoading(false);
    };

    const handleAddPlayer = async () => {
        const name = prompt('Nombre del jugador:');
        if (!name) return;

        const { data, error } = await supabase
            .from('player_rankings')
            .insert([{ season_id: season.id, name, points: 0 }])
            .select()
            .single();

        if (error) {
            alert('Error al añadir: ' + error.message);
        } else if (data) {
            setPlayers([...players, data].sort((a, b) => b.points - a.points));
        }
    };

    const handleUpdatePlayer = async (id: string, updates: Partial<PlayerRanking>) => {
        setSavingId(id);
        const { error } = await supabase
            .from('player_rankings')
            .update(updates)
            .eq('id', id);

        if (error) {
            alert('Error al actualizar: ' + error.message);
        } else {
            // Update local state and sort again
            setPlayers(current => 
                current.map(p => p.id === id ? { ...p, ...updates } : p)
                .sort((a, b) => b.points - a.points)
            );
        }
        setSavingId(null);
    };

    const handleDeletePlayer = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar a este jugador de la temporada?')) return;
        
        const { error } = await supabase
            .from('player_rankings')
            .delete()
            .eq('id', id);

        if (!error) {
            setPlayers(current => current.filter(p => p.id !== id));
        } else {
            alert('Error: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/5 pb-6">
                    <div>
                        <button onClick={onBack} className="text-[#00D1FF] hover:text-white flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest transition-colors">
                            <ArrowLeft size={16} /> Volver a Temporadas
                        </button>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">{season.title}</h2>
                        <p className="text-slate-400 font-mono text-sm">{season.subtitle} • Juego: {season.game_context}</p>
                    </div>
                    <button onClick={handleAddPlayer} className="bg-[#00FF85] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                        <Plus size={16} /> Añadir Jugador
                    </button>
                </div>

                <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden bg-slate-900/50 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-[10px] uppercase text-slate-500 tracking-widest bg-black/40 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-black">Pos</th>
                                    <th className="px-6 py-4 font-black">Jugador</th>
                                    <th className="px-6 py-4 font-black">Puntos</th>
                                    <th className="px-6 py-4 font-black">Foto URL</th>
                                    <th className="px-6 py-4 font-black">Personaje URL</th>
                                    <th className="px-6 py-4 font-black">Medalla URL</th>
                                    <th className="px-6 py-4 font-black text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold italic tracking-widest">Cargando jugadores...</td></tr>
                                ) : players.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold italic tracking-widest">No hay jugadores en esta temporada.</td></tr>
                                ) : (
                                    players.map((player, index) => (
                                        <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-black text-[#00D1FF]">#{index + 1}</td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    defaultValue={player.name}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== player.name) {
                                                            handleUpdatePlayer(player.id, { name: e.target.value });
                                                        }
                                                    }}
                                                    className="bg-black/30 border border-white/10 rounded px-3 py-2 w-full focus:border-[#00D1FF] outline-none transition-colors"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="number" 
                                                    defaultValue={player.points}
                                                    onBlur={(e) => {
                                                        const newVal = parseInt(e.target.value);
                                                        if (!isNaN(newVal) && newVal !== player.points) {
                                                            handleUpdatePlayer(player.id, { points: newVal });
                                                        }
                                                    }}
                                                    className="bg-black/30 border border-white/10 rounded px-3 py-2 w-24 focus:border-[#00FF85] outline-none transition-colors font-mono"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="https://"
                                                    defaultValue={player.player_photo_url || ''}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (player.player_photo_url || '')) {
                                                            handleUpdatePlayer(player.id, { player_photo_url: e.target.value });
                                                        }
                                                    }}
                                                    className="bg-black/30 border border-white/10 rounded px-3 py-2 w-32 focus:border-white/30 outline-none text-[10px]"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="https://"
                                                    defaultValue={player.game_asset_url || ''}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (player.game_asset_url || '')) {
                                                            handleUpdatePlayer(player.id, { game_asset_url: e.target.value });
                                                        }
                                                    }}
                                                    className="bg-black/30 border border-white/10 rounded px-3 py-2 w-32 focus:border-white/30 outline-none text-[10px]"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="text" 
                                                    placeholder="Opcional (Auto por CSS)"
                                                    defaultValue={player.tier_icon || ''}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (player.tier_icon || '')) {
                                                            handleUpdatePlayer(player.id, { tier_icon: e.target.value });
                                                        }
                                                    }}
                                                    className="bg-black/30 border border-white/10 rounded px-3 py-2 w-32 focus:border-white/30 outline-none text-[10px]"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {savingId === player.id ? (
                                                        <span className="text-[#00FF85] animate-pulse"><Save size={16} /></span>
                                                    ) : (
                                                        <button onClick={() => handleDeletePlayer(player.id)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RankingSeasonManager;
