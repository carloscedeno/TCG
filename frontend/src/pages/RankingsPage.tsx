import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Header } from '../components/Navigation/Header';
import { Footer } from '../components/Navigation/Footer';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { fetchCart } from '../utils/api';

interface RankingPlayer {
    id: string;
    name: string;
    faction: string;
    conquest_points: number;
    takedown_points: number;
    confirmed_kills: number;
    player_photo_url: string | null;
}

const calculateRank = (kills: number) => {
    if (kills >= 80) return { name: 'Almirante', icon: '/assets/ranks/almirante.png' };
    if (kills >= 50) return { name: 'Contraalmirante', icon: '/assets/ranks/contraalmirante.png' };
    if (kills >= 30) return { name: 'Capitán', icon: '/assets/ranks/capitan.png' };
    if (kills >= 20) return { name: 'Comandante', icon: '/assets/ranks/comandante.png' };
    if (kills >= 12) return { name: 'Teniente', icon: '/assets/ranks/teniente.png' };
    if (kills >= 8) return { name: 'Insignia', icon: '/assets/ranks/insignia.png' };
    if (kills >= 4) return { name: 'Suboficial en Jefe', icon: '/assets/ranks/suboficial_jefe.png' };
    return { name: 'Cadete', icon: '/assets/ranks/cadete.png' };
};

const getFactionIcon = (faction: string) => {
    if (!faction) return '/assets/factions/default.png';
    const slug = faction.toLowerCase().replace(/\s+/g, '_');
    return `/assets/factions/${slug}.png`;
};

const RankingsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const gameContext = searchParams.get('game') || 'GND'; // Default to Gundam for mockups
    const [players, setPlayers] = useState<RankingPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const loadInitial = async () => {
            const cartData = await fetchCart();
            const count = Array.isArray(cartData?.items)
                ? cartData.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
                : 0;
            setCartCount(count);
        };
        loadInitial();
    }, []);

    useEffect(() => {
        const loadRankings = async () => {
            setLoading(true);
            
            // Get active season for the game
            const { data: season } = await supabase
                .from('ranking_seasons')
                .select('*')
                .eq('game_context', gameContext)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (season) {
                const { data } = await supabase
                    .from('player_rankings')
                    .select('*')
                    .eq('season_id', season.id)
                    .order('confirmed_kills', { ascending: false })
                    .order('takedown_points', { ascending: false })
                    .order('conquest_points', { ascending: false });
                
                if (data) {
                    setPlayers(data);
                }
            } else {
                setPlayers([]);
            }
            setLoading(false);
        };

        loadRankings();
    }, [gameContext]);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-white/30">
            <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />
            
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12">
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-2">
                        Ranking Oficial
                    </h1>
                    <p className="text-neutral-400 font-bold tracking-widest text-sm uppercase">Sistema de Clasificación Militar por Kills</p>
                </div>

                <div className="bg-[#0A0D18] rounded-3xl border border-[#1C233A] overflow-hidden shadow-2xl relative">
                    {/* Glowing Accent Top */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4B6EEB] to-transparent opacity-50" />
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="text-[10px] uppercase tracking-widest bg-[#0A0D18] text-[#5A6D93] border-b border-[#1C233A]">
                                <tr>
                                    <th className="px-6 py-4 md:px-8 font-black w-24">Lugar</th>
                                    <th className="px-4 py-4 font-black text-center">Facción</th>
                                    <th className="px-4 py-4 font-black">Jugador</th>
                                    <th className="px-4 py-4 font-black">Nombre del Jugador</th>
                                    <th className="px-4 py-4 font-black text-center">Puntos de<br/>Conquista</th>
                                    <th className="px-4 py-4 font-black text-center">Puntos de<br/>Derribo</th>
                                    <th className="px-4 py-4 font-black text-center">Confirmed<br/>Kills</th>
                                    <th className="px-6 py-4 md:px-8 font-black text-center">Rango</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#151B2E]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center">
                                            <div className="animate-pulse flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                                <span className="text-[#5A6D93] font-bold tracking-widest text-xs uppercase">Calculando Rangos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : players.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-20 text-center text-[#5A6D93] font-black italic tracking-widest text-sm uppercase">
                                            Aún no hay reclutas registrados en esta temporada.
                                        </td>
                                    </tr>
                                ) : (
                                    players.map((player, index) => {
                                        const rank = calculateRank(player.confirmed_kills);
                                        const factionIcon = getFactionIcon(player.faction);
                                        const suffix = index === 0 ? 'ero' : index === 1 ? 'do' : index === 2 ? 'ero' : index === 3 ? 'to' : index === 4 ? 'to' : index === 5 ? 'to' : index === 6 ? 'mo' : index === 7 ? 'vo' : index === 8 ? 'no' : 'mo';
                                        const isTop3 = index < 3;
                                        
                                        return (
                                            <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 md:px-8">
                                                    <div className="flex items-baseline">
                                                        <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-white/90 group-hover:text-white transition-colors">{index + 1}</span>
                                                        <span className="text-sm font-black italic text-white/50">{suffix}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-12 h-12 flex items-center justify-center">
                                                            <img src={factionIcon} alt={player.faction} className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="w-12 h-12 rounded overflow-hidden bg-slate-800">
                                                        {player.player_photo_url ? (
                                                            <img src={player.player_photo_url} alt={player.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px] font-black">?</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <h3 className={`font-black uppercase tracking-wider text-lg ${isTop3 ? 'text-white' : 'text-white/80'}`}>{player.name}</h3>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-mono text-lg font-bold text-white/70">{player.conquest_points}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-mono text-lg font-bold text-white/70">{player.takedown_points}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-mono text-2xl font-black text-white">{player.confirmed_kills}</span>
                                                </td>
                                                <td className="px-6 py-4 md:px-8">
                                                    <div className="flex items-center justify-center">
                                                        <div className="w-20 h-10 flex items-center justify-center" title={rank.name}>
                                                            <img src={rank.icon} alt={rank.name} className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-white/30 uppercase">${rank.name}</span>`;
                                                            }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <Footer />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default RankingsPage;
