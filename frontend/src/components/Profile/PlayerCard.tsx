import React from 'react';
import {
    Trophy,
    Sword,
    BookOpen,
    Zap,
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
    title: string;
    avatarUrl?: string;
    stats: TCGStat[];
    dndStats: {
        level: number;
        xp: number;
        nextLevelXp: number;
        rank: string;
        achievements: string[];
    };
}

const PlayerCard: React.FC<PlayerCardProps> = ({
    username = "CYBER_WIZARD",
    title = "Elite Member • Geekorium Vanguard",
    stats,
    dndStats
}) => {
    return (
        <div className="w-full max-w-4xl mx-auto p-1 rounded-3xl overflow-hidden glass-card neon-border-gold">
            <div className="p-8 space-y-8">

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-geeko-gold p-1">
                            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                <User size={64} className="text-geeko-gold" />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-geeko-gold text-black rounded-full p-2 border-4 border-geeko-black">
                            <Shield size={20} />
                        </div>
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-4xl font-black neon-text-gold tracking-tighter uppercase italic">
                            {username}
                        </h1>
                        <p className="text-slate-400 font-medium tracking-wide text-sm">
                            {title}
                        </p>
                        <div className="flex gap-2 mt-4 justify-center md:justify-start">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-geeko-cyan">
                                    <Medal size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* TCG Stats Grid */}
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
                                <div className="text-3xl font-black neon-text-cyan flex items-baseline gap-1">
                                    {stat.elo}
                                    <span className="text-xs font-medium text-slate-500 uppercase italic">ELO</span>
                                </div>
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    <span>{stat.tier} TIER</span>
                                    <span className="neon-text-cyan">{stat.progress}%</span>
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

                {/* D&D Prestige Section */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-geeko-red/20 to-geeko-purple/20 border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-geeko-red/20 border border-geeko-red/50">
                                <Trophy size={24} className="text-geeko-red" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tighter">D&D Prestige</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold font-mono">Rank: {dndStats.rank}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-500 uppercase font-black font-mono">Campaign Progress</span>
                            <div className="text-3xl font-black text-white italic">
                                LVL <span className="neon-text-gold">{dndStats.level}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Experience Points (XP)</span>
                            <span className="text-[10px] font-bold text-white font-mono">{dndStats.xp} / {dndStats.nextLevelXp} XP</span>
                        </div>
                        <div className="h-3 w-full bg-geeko-black/50 rounded-full border border-white/10 p-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-geeko-red via-geeko-purple to-geeko-cyan rounded-full shadow-[0_0_10px_rgba(225,48,108,0.5)]"
                                style={{ width: `${(dndStats.xp / dndStats.nextLevelXp) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        {dndStats.achievements.map((ach) => (
                            <div key={ach} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 uppercase italic transition-colors hover:bg-white/10">
                                <BookOpen size={12} className="text-geeko-cyan" />
                                {ach}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerCard;
