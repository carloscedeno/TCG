import React from 'react';
import {
    Sword,
    Shield,
    Star,
    User,
    Medal
} from 'lucide-react';

interface TCGStat {
    name: string;
    gameCode: string;
    elo: number;
    tier: string;
    progress: number;
    recentDeck: string;
    colorClass: string;
}

interface PlayerCardProps {
    username: string;
    fullName?: string;
    title: string;
    avatarUrl?: string;
    stats: TCGStat[];
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    username = "CYBER_WIZARD",
    fullName,
    title = "Elite Member • Geekorium Vanguard",
    avatarUrl,
    stats
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto p-1 rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="p-8 space-y-8">

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-geeko-cyan p-1 shadow-[0_0_30px_rgba(0,209,255,0.3)] bg-[#050505] flex-shrink-0">
                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-geeko-cyan" />
                                )}
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-geeko-cyan text-black rounded-full p-2 border-4 border-[#050505]">
                            <Shield size={20} />
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-geeko-cyan to-blue-500 tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(0,209,255,0.4)]">
                            {username}
                        </h1>
                        {fullName && (
                            <p className="text-white font-bold tracking-wide text-lg uppercase">
                                {fullName}
                            </p>
                        )}
                        <p className="text-slate-400 font-medium tracking-wide text-sm">
                            {title}
                        </p>
                        <div className="flex gap-2 mt-4 justify-center md:justify-start">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white">
                                    <Medal size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {stats.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {stats.map((stat) => (
                            <div key={stat.gameCode} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group overflow-hidden relative">
                                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 -mr-8 -mt-8 ${stat.colorClass}`}></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                        <Star size={18} className={stat.colorClass.replace('bg-', 'text-')} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.name}</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                        {stat.elo}
                                        <span className="text-xs font-medium text-slate-500 uppercase italic">ELO</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                        <span>{stat.tier} TIER</span>
                                        <span className="text-white">{stat.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full opacity-80 ${stat.colorClass}`}
                                            style={{ width: `${stat.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500">
                                    <Sword size={12} />
                                    <span className="truncate">Recent: {stat.recentDeck}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sin Estadísticas TCG</p>
                        <p className="text-xs text-slate-500 mt-2">Agrega cartas a tu colección o participa en torneos.</p>
                    </div>
                )}


            </div>
        </div>
    );
};

export default PlayerCard;
