import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

interface PlayerRankingsListProps {
    userId: string;
    username: string;
}

const calculateRank = (kills: number, faction: string) => {
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

export const PlayerRankingsList = ({ userId, username }: PlayerRankingsListProps) => {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            if (!userId) return;
            // Fetch rankings matching user_id OR matching username exactly
            const { data } = await supabase
                .from('player_rankings')
                .select(`
                    *,
                    ranking_seasons (
                        title,
                        game_context
                    )
                `)
                .or(`user_id.eq.${userId},name.ilike.${username}`);

            if (data) {
                setRankings(data);
            }
            setLoading(false);
        };

        fetchRankings();
    }, [userId, username]);

    if (loading) {
        return <div className="animate-pulse text-white/50 text-sm font-bold uppercase tracking-widest">Buscando misiones militares...</div>;
    }

    if (rankings.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Aún no tienes rangos militares asignados.</p>
                <p className="text-white/20 text-[10px] mt-2">Dile al administrador que enlace tu usuario en el panel de rankings.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankings.map((ranking) => {
                const rank = calculateRank(ranking.confirmed_kills || 0, ranking.faction);
                
                return (
                    <div key={ranking.id} className="bg-gradient-to-br from-[#0A0D18] to-black border border-[#1C233A] rounded-2xl p-4 relative overflow-hidden group hover:border-[#4B6EEB]/50 transition-colors">
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4B6EEB]/10 rounded-full blur-3xl group-hover:bg-[#4B6EEB]/20 transition-colors" />
                        
                        <div className="flex items-center gap-4 relative z-10">
                            {/* Rank Icon */}
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                                <img src={rank.icon} alt={rank.name} className="max-w-full max-h-full object-contain filter drop-shadow-lg group-hover:scale-110 transition-transform" />
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1">
                                <div className="text-[9px] text-[#5A6D93] font-black uppercase tracking-widest mb-1">
                                    {ranking.ranking_seasons?.game_context || 'TCG'} • {ranking.ranking_seasons?.title}
                                </div>
                                <h4 className="text-white font-black italic tracking-wider text-lg uppercase">{rank.name}</h4>
                                <div className="text-xs text-white/60 font-bold uppercase tracking-widest mt-1 flex gap-3">
                                    <span>Kills: <span className="text-[#00FF85]">{ranking.confirmed_kills || 0}</span></span>
                                    <span>Conq: <span className="text-white/80">{ranking.conquest_points || 0}</span></span>
                                    <span>Derribo: <span className="text-white/80">{ranking.takedown_points || 0}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
