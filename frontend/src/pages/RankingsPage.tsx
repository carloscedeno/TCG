import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { Header } from '../components/Navigation/Header';
import { Footer } from '../components/Navigation/Footer';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { fetchCart } from '../utils/api';

interface RankingCategory {
    id: string;
    name: string;
    image_url: string | null;
}

interface RankingTier {
    id: string;
    name: string;
    image_url: string | null;
}

interface RankingPlayer {
    id: string;
    name: string;
    faction: string;
    conquest_points: number;
    takedown_points: number;
    confirmed_kills: number;
    points: number;
    player_photo_url: string | null;
    ranking_categories?: RankingCategory;
    ranking_tiers?: RankingTier;
}

const calculateGundamRank = (kills: number, faction: string) => {
    const isZeon = faction === 'ZEON';
    const prefix = isZeon ? 'Z' : 'F';
    let baseName = '';
    let displayName = '';
    
    if (kills >= 80) { baseName = 'ALMIRANTE'; displayName = 'Almirante'; }
    else if (kills >= 50) { baseName = 'CONTRALMIRANTE'; displayName = 'Contraalmirante'; }
    else if (kills >= 30) { baseName = 'CAPITAN'; displayName = 'Capitán'; }
    else if (kills >= 20) { baseName = 'COMANDANTE'; displayName = 'Comandante'; }
    else if (kills >= 12) { baseName = 'TENIENTE'; displayName = 'Teniente'; }
    else if (kills >= 8) { baseName = 'INSIGNIA'; displayName = 'Insignia'; }
    else if (kills >= 4) { baseName = 'SUBOFICIAL EN JEFE'; displayName = 'Suboficial en Jefe'; }
    else { baseName = 'CABO'; displayName = isZeon ? 'Cadete' : 'Tripulante'; }
    
    return { name: displayName, icon: `/assets/ranks/${prefix} ${baseName}.png` };
};

const getGundamFactionIcon = (faction: string) => {
    if (!faction) return '/assets/factions/default.png';
    const slug = faction.toLowerCase().replace(/\s+/g, '_');
    return `/assets/factions/${slug}.png`;
};

const RankingsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const gameContext = searchParams.get('game') || 'GND'; 
    const [players, setPlayers] = useState<RankingPlayer[]>([]);
    const [seasonInfo, setSeasonInfo] = useState<any>(null);
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
            setPlayers([]);
            
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
                setSeasonInfo(season);
                const { data } = await supabase
                    .from('player_rankings')
                    .select('*, ranking_categories(*), ranking_tiers(*)')
                    .eq('season_id', season.id)
                    .order('points', { ascending: false })
                    .order('confirmed_kills', { ascending: false });
                
                if (data) {
                    setPlayers(data);
                }
            } else {
                setSeasonInfo(null);
            }
            setLoading(false);
        };

        loadRankings();
    }, [gameContext]);

    const isGundam = gameContext === 'GND';

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-white/30">
            <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />
            
            <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12">
                <div className="mb-12 text-center md:text-left flex items-center gap-6">
                    {seasonInfo?.image_url && (
                        <img src={seasonInfo.image_url} alt="Season Logo" className="w-24 h-24 object-contain filter drop-shadow-xl" />
                    )}
                    <div>
                        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-2">
                            {seasonInfo?.title || 'Ranking Oficial'}
                        </h1>
                        <p className="text-neutral-400 font-bold tracking-widest text-sm uppercase">
                            {seasonInfo?.subtitle || (isGundam ? 'Sistema de Clasificación Militar' : 'Clasificación de Temporada')}
                        </p>
                    </div>
                </div>

                <div className="bg-[#0A0D18] rounded-3xl border border-[#1C233A] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4B6EEB] to-transparent opacity-50" />
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="text-[10px] uppercase tracking-widest bg-[#0A0D18] text-[#5A6D93] border-b border-[#1C233A]">
                                <tr>
                                    <th className="px-6 py-4 md:px-8 font-black w-24">Lugar</th>
                                    <th className="px-4 py-4 font-black text-center">{isGundam ? 'Facción' : 'Equipo'}</th>
                                    <th className="px-4 py-4 font-black">Jugador</th>
                                    <th className="px-4 py-4 font-black">Nombre del Jugador</th>
                                    {isGundam ? (
                                        <>
                                            <th className="px-4 py-4 font-black text-center">Conquista</th>
                                            <th className="px-4 py-4 font-black text-center">Derribo</th>
                                            <th className="px-4 py-4 font-black text-center">Confirmed Kills</th>
                                        </>
                                    ) : (
                                        <th className="px-4 py-4 font-black text-center">Puntos</th>
                                    )}
                                    <th className="px-6 py-4 md:px-8 font-black text-center">Rango</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#151B2E]">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isGundam ? 8 : 6} className="py-20 text-center">
                                            <div className="animate-pulse flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                                <span className="text-[#5A6D93] font-bold tracking-widest text-xs uppercase">Calculando Rangos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : players.length === 0 ? (
                                    <tr>
                                        <td colSpan={isGundam ? 8 : 6} className="py-20 text-center text-[#5A6D93] font-black italic tracking-widest text-sm uppercase">
                                            Aún no hay reclutas registrados en esta temporada.
                                        </td>
                                    </tr>
                                ) : (
                                    players.map((player, index) => {
                                        const suffix = index === 0 ? 'ero' : index === 1 ? 'do' : index === 2 ? 'ero' : index === 3 ? 'to' : index === 4 ? 'to' : index === 5 ? 'to' : index === 6 ? 'mo' : index === 7 ? 'vo' : index === 8 ? 'no' : 'mo';
                                        const isTop3 = index < 3;
                                        
                                        // Dynamic Faction/Team visual
                                        let factionName = '';
                                        let factionIconUrl = '';
                                        
                                        if (isGundam) {
                                            factionName = player.faction;
                                            factionIconUrl = getGundamFactionIcon(player.faction);
                                        } else {
                                            factionName = player.ranking_categories?.name || 'Agente Libre';
                                            factionIconUrl = player.ranking_categories?.image_url || '/assets/factions/default.png';
                                        }

                                        // Dynamic Rank visual
                                        let rankName = '';
                                        let rankIconUrl = '';

                                        if (isGundam) {
                                            const rank = calculateGundamRank(player.confirmed_kills, player.faction);
                                            rankName = rank.name;
                                            rankIconUrl = rank.icon;
                                        } else {
                                            rankName = player.ranking_tiers?.name || 'Sin Rango';
                                            rankIconUrl = player.ranking_tiers?.image_url || '';
                                        }

                                        return (
                                            <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4 md:px-8">
                                                    <div className="flex items-baseline">
                                                        <span className="text-4xl md:text-5xl font-black italic tracking-tighter text-white/90 group-hover:text-white transition-colors">{index + 1}</span>
                                                        <span className="text-sm font-black italic text-white/50">{suffix}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center" title={factionName}>
                                                        <div className="w-12 h-12 flex items-center justify-center">
                                                            <img src={factionIconUrl} alt={factionName} className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]" onError={(e) => (e.currentTarget.style.display = 'none')} />
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
                                                    {!isGundam && player.ranking_categories && (
                                                        <p className="text-xs font-mono text-[#00D1FF]">{player.ranking_categories.name}</p>
                                                    )}
                                                </td>
                                                
                                                {isGundam ? (
                                                    <>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="font-mono text-lg font-bold text-white/70">{player.conquest_points}</span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="font-mono text-lg font-bold text-white/70">{player.takedown_points}</span>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="font-mono text-2xl font-black text-white">{player.confirmed_kills}</span>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-mono text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{player.points || 0}</span>
                                                    </td>
                                                )}

                                                <td className="px-6 py-4 md:px-8">
                                                    <div className="flex items-center justify-center">
                                                        {rankIconUrl ? (
                                                            <div className="w-20 h-10 flex items-center justify-center" title={rankName}>
                                                                <img src={rankIconUrl} alt={rankName} className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement!.innerHTML = `<span class="text-[8px] font-bold text-white/30 uppercase">${rankName}</span>`;
                                                                }} />
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-[#5A6D93] uppercase tracking-widest">{rankName}</span>
                                                        )}
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
