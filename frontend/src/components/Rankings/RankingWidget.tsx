import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import type { RankingSeason } from '../../pages/Admin/AdminRankingsPage';

interface PlayerRanking {
    id: string;
    season_id: string;
    name: string;
    points: number;
    player_photo_url: string | null;
    game_asset_url: string | null;
    tier_icon: string | null;
}

interface RankingWidgetProps {
    seasonId?: string;
    gameContext?: string;
}

export const RankingWidget: React.FC<RankingWidgetProps> = ({ seasonId, gameContext }) => {
    const [season, setSeason] = useState<RankingSeason | null>(null);
    const [players, setPlayers] = useState<PlayerRanking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRankingData();
    }, [seasonId, gameContext]);

    const fetchRankingData = async () => {
        setLoading(true);
        let currentSeason = null;

        // Fetch Season Info
        if (seasonId) {
            const { data } = await supabase.from('ranking_seasons').select('*').eq('id', seasonId).single();
            currentSeason = data;
        } else if (gameContext) {
            const { data } = await supabase.from('ranking_seasons').select('*').eq('game_context', gameContext).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
            currentSeason = data;
        }

        if (currentSeason) {
            setSeason(currentSeason);
            const { data: playersData } = await supabase
                .from('player_rankings')
                .select('*')
                .eq('season_id', currentSeason.id)
                .order('points', { ascending: false });
            
            if (playersData) {
                setPlayers(playersData);
            }
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="animate-pulse bg-slate-900/50 rounded-3xl h-96 w-full flex items-center justify-center text-white/50 font-black italic tracking-widest text-xs uppercase">Cargando Ranking...</div>;
    }

    if (!season || players.length === 0) {
        return <div className="bg-slate-900/50 rounded-3xl p-8 text-center text-white/50 border border-white/5 font-black italic tracking-widest text-xs uppercase">No hay ranking disponible</div>;
    }

    // Determine Theme Based on Game Context
    const getThemeColors = (game: string) => {
        switch (game.toLowerCase()) {
            case 'yugioh': return { primary: '#FCAF45', bg: 'from-orange-900/40', border: 'border-orange-500/30' };
            case 'mtg': return { primary: '#E1306C', bg: 'from-red-900/40', border: 'border-red-500/30' };
            case 'pokemon': return { primary: '#405DE6', bg: 'from-blue-900/40', border: 'border-blue-500/30' };
            case 'onepiece': return { primary: '#F77737', bg: 'from-orange-800/40', border: 'border-orange-500/30' };
            case 'lorcana': return { primary: '#833AB4', bg: 'from-purple-900/40', border: 'border-purple-500/30' };
            default: return { primary: '#00D1FF', bg: 'from-cyan-900/40', border: 'border-cyan-500/30' };
        }
    };

    const theme = getThemeColors(season.game_context);

    return (
        <div className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${theme.bg} to-slate-950 border ${theme.border} p-6 md:p-8 shadow-2xl`}>
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center text-center mb-8 border-b border-white/10 pb-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }}></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Ranking Oficial</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-white drop-shadow-lg leading-none mb-2" style={{ textShadow: `0 0 20px ${theme.primary}60` }}>
                    {season.title}
                </h2>
                <h3 className="text-sm md:text-base font-bold uppercase tracking-widest text-white/50">{season.subtitle}</h3>
            </div>

            {/* Players List */}
            <div className="flex flex-col gap-3 relative z-10">
                {players.map((player, index) => {
                    const isTop1 = index === 0;
                    const isTop3 = index < 3;
                    
                    return (
                        <div 
                            key={player.id} 
                            className={`group relative flex items-center justify-between p-3 md:p-4 rounded-2xl bg-black/40 backdrop-blur-md border ${isTop1 ? 'border-white/30' : 'border-white/5'} hover:bg-white/10 transition-all overflow-hidden`}
                        >
                            {/* Hover effect glow */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)` }}></div>

                            <div className="flex items-center gap-4 md:gap-6 relative z-10">
                                {/* Rank Number */}
                                <div className={`w-10 text-center font-black italic ${isTop1 ? 'text-3xl text-white drop-shadow-md' : isTop3 ? 'text-2xl text-white/90' : 'text-xl text-white/40'}`}>
                                    {index + 1}<span className="text-[10px] uppercase align-top">{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}</span>
                                </div>

                                {/* Composed Avatar */}
                                <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                                    {/* Background Game Asset */}
                                    <div className={`absolute inset-0 rounded-xl overflow-hidden ${!player.game_asset_url && 'bg-slate-800'}`}>
                                        {player.game_asset_url && (
                                            <img src={player.game_asset_url} alt="Game Asset" className="w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-500" />
                                        )}
                                    </div>
                                    
                                    {/* Player Photo with Hexagon Clip Path */}
                                    {player.player_photo_url ? (
                                        <div className="absolute -right-2 -bottom-2 w-12 h-12 md:w-14 md:h-14 border-[3px] border-black rounded-full overflow-hidden shadow-2xl z-20 bg-slate-900">
                                            <img src={player.player_photo_url} alt={player.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="absolute -right-2 -bottom-2 w-12 h-12 md:w-14 md:h-14 border-[3px] border-black rounded-full overflow-hidden shadow-2xl z-20 bg-slate-800 flex items-center justify-center">
                                            <span className="text-white/30 text-[10px] font-black italic">?</span>
                                        </div>
                                    )}
                                </div>

                                {/* Player Info */}
                                <div className="flex flex-col justify-center">
                                    <h4 className={`font-black uppercase tracking-wider ${isTop1 ? 'text-xl md:text-2xl text-white' : 'text-base md:text-lg text-white/90'}`}>
                                        {player.name}
                                    </h4>
                                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.primary }}>Geekorium Player</span>
                                </div>
                            </div>

                            {/* Points and Tier */}
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="text-right">
                                    <div className="flex items-baseline gap-1 justify-end">
                                        <span className={`font-black italic leading-none ${isTop1 ? 'text-4xl text-white' : 'text-2xl md:text-3xl text-white/80'}`}>{player.points}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">PTS</span>
                                    </div>
                                </div>
                                {/* Tier Icon (if any) */}
                                {player.tier_icon && (
                                    <div className="hidden md:flex w-12 h-12 flex-shrink-0 items-center justify-center drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-110 transition-transform">
                                        <img src={player.tier_icon} alt="Tier Medal" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Background Glow Effect */}
            <div className="absolute top-1/4 -right-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20 pointer-events-none" style={{ backgroundColor: theme.primary }}></div>
        </div>
    );
};
