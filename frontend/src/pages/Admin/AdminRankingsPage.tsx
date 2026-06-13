import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus, Edit2, Archive, CheckCircle, Trash2, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import RankingSeasonManager from '../../components/Admin/RankingSeasonManager';

export interface RankingSeason {
    id: string;
    game_context: string;
    title: string;
    subtitle: string | null;
    is_active: boolean;
    created_at: string;
}

const AdminRankingsPage = () => {
    const [seasons, setSeasons] = useState<RankingSeason[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState<RankingSeason | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeason, setEditingSeason] = useState<RankingSeason | null>(null);
    const [formData, setFormData] = useState({ title: '', subtitle: '', game_context: 'MTG' });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const TCG_GAMES = [
        { name: 'Magic', code: 'MTG', icon: '/logos/tcg/MTG.png' },
        { name: 'Pokémon', code: 'PKM', icon: '/logos/tcg/PKM.png' },
        { name: 'Yu-Gi-Oh!', code: 'YGO', icon: '/logos/tcg/YGO.png' },
        { name: 'Riftbound', code: 'RFB', icon: '/logos/tcg/RFB.png' },
        { name: 'One Piece', code: 'OPC', icon: '/logos/tcg/OPC.png' },
        { name: 'Digimon', code: 'DGM', icon: '/logos/tcg/DGM.png' },
        { name: 'Gundam', code: 'GND', icon: '/logos/tcg/GND.png' },
        { name: 'Flesh and Blood', code: 'FAB', icon: '/logos/tcg/FAB.png' },
        { name: 'Otros', code: 'OTHERS', icon: '/logos/tcg/OTHERS.png' }
    ];

    useEffect(() => {
        fetchSeasons();
    }, []);

    const fetchSeasons = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ranking_seasons')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSeasons(data);
        }
        setLoading(false);
    };

    const openCreateModal = () => {
        setEditingSeason(null);
        setFormData({ title: '', subtitle: '', game_context: 'MTG' });
        setIsModalOpen(true);
        setIsDropdownOpen(false);
    };

    const openEditModal = (season: RankingSeason) => {
        setEditingSeason(season);
        setFormData({ title: season.title, subtitle: season.subtitle || '', game_context: season.game_context });
        setIsModalOpen(true);
        setIsDropdownOpen(false);
    };

    const handleSaveSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.game_context) return;

        let error;
        if (editingSeason) {
            const { error: updateError } = await supabase
                .from('ranking_seasons')
                .update({
                    title: formData.title,
                    subtitle: formData.subtitle,
                    game_context: formData.game_context
                })
                .eq('id', editingSeason.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('ranking_seasons')
                .insert([{
                    title: formData.title,
                    subtitle: formData.subtitle,
                    game_context: formData.game_context,
                    is_active: true
                }]);
            error = insertError;
        }

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            setIsModalOpen(false);
            fetchSeasons();
        }
    };

    const handleDeleteSeason = async (id: string) => {
        if (!confirm('¿Estás SEGURO de que deseas eliminar esta temporada? Se perderán todos sus jugadores.')) return;
        
        const { error } = await supabase
            .from('ranking_seasons')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            fetchSeasons();
        }
    };

    const toggleStatus = async (season: RankingSeason) => {
        if (!confirm(`¿Seguro que quieres ${season.is_active ? 'desactivar' : 'activar'} esta temporada?`)) return;

        const { error } = await supabase
            .from('ranking_seasons')
            .update({ is_active: !season.is_active })
            .eq('id', season.id);

        if (!error) {
            fetchSeasons();
        } else {
            alert('Error: ' + error.message);
        }
    };

    if (selectedSeason) {
        return <RankingSeasonManager season={selectedSeason} onBack={() => setSelectedSeason(null)} />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex-shrink-0 group relative">
                            <img src="/branding/Logo.png" alt="Geekorium" className="w-32 sm:w-40 object-contain group-hover:scale-105 transition-transform" />
                        </Link>
                        <div className="h-10 w-px bg-white/10 hidden md:block"></div>
                        <div className="hidden md:block">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="text-[#00D1FF] w-4 h-4" />
                                <span className="text-[#00D1FF] font-black text-[10px] tracking-widest uppercase">Admin Terminal</span>
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tighter italic leading-none">GESTIÓN DE <span className="text-white/50">RANKINGS</span></h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="text-slate-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Admin
                        </Link>
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <button onClick={openCreateModal} className="bg-[#00D1FF] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
                        <Plus size={16} /> Nueva Temporada
                    </button>
                </div>

                <div className="glass-card rounded-[2rem] border border-white/10 overflow-hidden bg-slate-900/50 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-[10px] uppercase text-slate-500 tracking-widest bg-black/40 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 font-black">Título</th>
                                    <th className="px-6 py-4 font-black">Subtítulo</th>
                                    <th className="px-6 py-4 font-black">Juego</th>
                                    <th className="px-6 py-4 font-black text-center">Estado</th>
                                    <th className="px-6 py-4 font-black text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold italic uppercase tracking-widest text-xs">Cargando temporadas...</td></tr>
                                ) : seasons.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold italic uppercase tracking-widest text-xs">No hay temporadas registradas</td></tr>
                                ) : (
                                    seasons.map(season => (
                                        <tr key={season.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-white">{season.title}</td>
                                            <td className="px-6 py-4 text-slate-400">{season.subtitle || '-'}</td>
                                            <td className="px-6 py-4 font-mono text-[10px] text-[#00D1FF] bg-[#00D1FF]/10 rounded px-2 w-max">{season.game_context}</td>
                                            <td className="px-6 py-4 text-center">
                                                {season.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#00FF85] bg-[#00FF85]/10 px-2 py-1 rounded border border-[#00FF85]/20">
                                                        Activa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20">
                                                        Inactiva
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setSelectedSeason(season)} className="p-2 bg-white/5 hover:bg-[#00D1FF]/20 rounded-lg text-white hover:text-[#00D1FF] transition-colors" title="Gestionar Jugadores">
                                                        <Shield size={16} />
                                                    </button>
                                                    <button onClick={() => openEditModal(season)} className="p-2 bg-white/5 hover:bg-orange-500/20 rounded-lg text-white hover:text-orange-500 transition-colors" title="Editar Temporada">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => toggleStatus(season)} className={`p-2 rounded-lg transition-colors ${season.is_active ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-[#00FF85]/10 hover:bg-[#00FF85]/20 text-[#00FF85]'}`} title={season.is_active ? 'Desactivar' : 'Activar'}>
                                                        {season.is_active ? <Archive size={16} /> : <CheckCircle size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteSeason(season.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors" title="Eliminar Temporada">
                                                        <Trash2 size={16} />
                                                    </button>
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

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black italic tracking-tighter uppercase">{editingSeason ? 'Editar Temporada' : 'Nueva Temporada'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSeason} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Título</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={formData.title} 
                                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                    placeholder="Ej. TOP 20"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00D1FF] outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Subtítulo (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={formData.subtitle} 
                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })} 
                                    placeholder="Ej. 2025/SEASON 2"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00D1FF] outline-none transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Juego / TCG</label>
                                <div 
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer hover:border-[#00D1FF]/50 transition-colors flex items-center justify-between"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className="flex items-center gap-3">
                                        {TCG_GAMES.find(g => g.code === formData.game_context)?.icon ? (
                                            <img src={TCG_GAMES.find(g => g.code === formData.game_context)?.icon} className="w-6 h-6 object-contain" alt="Logo" />
                                        ) : (
                                            <div className="w-6 h-6 bg-white/10 rounded-full"></div>
                                        )}
                                        <span className="font-mono text-sm">{formData.game_context} - {TCG_GAMES.find(g => g.code === formData.game_context)?.name || 'Desconocido'}</span>
                                    </div>
                                    <span className="text-white/50 text-xs">▼</span>
                                </div>
                                
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto">
                                        {TCG_GAMES.map(game => (
                                            <div 
                                                key={game.code}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setFormData({ ...formData, game_context: game.code });
                                                    setIsDropdownOpen(false);
                                                }}
                                            >
                                                <img src={game.icon} alt={game.name} className="w-6 h-6 object-contain" />
                                                <span className="text-white font-medium">{game.name} <span className="text-white/50 text-xs ml-2 font-mono">{game.code}</span></span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button type="submit" className="w-full mt-8 bg-[#00D1FF] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,209,255,0.2)]">
                                {editingSeason ? 'Guardar Cambios' : 'Crear Temporada'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRankingsPage;
