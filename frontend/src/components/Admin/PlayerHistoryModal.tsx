import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, History, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PlayerHistoryEntry {
    id: string;
    previous_kills: number;
    new_kills: number;
    previous_conquest: number;
    new_conquest: number;
    previous_takedown: number;
    new_takedown: number;
    previous_rank_name: string;
    new_rank_name: string;
    reason: string;
    created_at: string;
}

interface PlayerHistoryModalProps {
    playerId: string;
    playerName: string;
    onClose: () => void;
}

export const PlayerHistoryModal = ({ playerId, playerName, onClose }: PlayerHistoryModalProps) => {
    const [history, setHistory] = useState<PlayerHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data, error } = await supabase
                .from('player_ranking_history')
                .select('*')
                .eq('player_ranking_id', playerId)
                .order('created_at', { ascending: false });

            if (data && !error) {
                setHistory(data);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [playerId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-950 border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00D1FF]/10 border border-[#00D1FF]/20 flex items-center justify-center text-[#00D1FF]">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic tracking-tighter uppercase text-white">Historial de Rango</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{playerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D1FF]"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500 font-bold uppercase tracking-widest">No hay registros históricos para este jugador.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {history.map((entry) => {
                                const isPromotion = entry.new_kills > entry.previous_kills;
                                const isDemotion = entry.new_kills < entry.previous_kills;
                                const killsDiff = entry.new_kills - entry.previous_kills;
                                const hasRankChanged = entry.new_rank_name !== entry.previous_rank_name;

                                return (
                                    <div key={entry.id} className="relative pl-8">
                                        {/* Timeline Line */}
                                        <div className="absolute left-3.5 top-8 bottom-[-24px] w-px bg-white/10 last:hidden"></div>
                                        
                                        {/* Timeline Dot */}
                                        <div className={`absolute left-2 top-2 w-3 h-3 rounded-full border-2 border-slate-950 ${isPromotion ? 'bg-[#00FF85]' : isDemotion ? 'bg-rose-500' : 'bg-[#00D1FF]'}`}></div>
                                        
                                        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 hover:bg-slate-900/80 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(entry.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/60 font-bold uppercase tracking-wider">
                                                    {entry.reason}
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cambio de Rango</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-300">{entry.previous_rank_name || 'N/A'}</span>
                                                        <span className="text-slate-500">→</span>
                                                        <span className={`text-sm font-black ${hasRankChanged ? (isPromotion ? 'text-[#00FF85]' : 'text-rose-400') : 'text-white'}`}>
                                                            {entry.new_rank_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Puntos / Kills</p>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs font-bold text-slate-400">Kills:</span>
                                                            <span className="text-sm font-black text-white">{entry.new_kills}</span>
                                                            {killsDiff !== 0 && (
                                                                <span className={`text-[10px] font-black flex items-center ${killsDiff > 0 ? 'text-[#00FF85]' : 'text-rose-400'}`}>
                                                                    {killsDiff > 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                                                                    {killsDiff > 0 ? '+' : ''}{killsDiff}
                                                                </span>
                                                            )}
                                                            {killsDiff === 0 && <Minus size={10} className="text-slate-500" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
