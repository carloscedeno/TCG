import React from 'react';
import { Calendar, Trophy, Users, Swords, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data for initial display (until we connect to Supabase real data)
const UPCOMING_TOURNAMENTS = [
    {
        id: '1',
        name: 'Friday Night Magic: Standard Showdown',
        game: 'Magic: The Gathering',
        date: '2026-02-14T18:00:00',
        format: 'Standard',
        entryFee: '$10',
        registered: 12,
        capacity: 32,
        color: 'border-geeko-red',
        iconColor: 'text-geeko-red'
    },
    {
        id: '2',
        name: 'Pokémon League Challenge',
        game: 'Pokémon TCG',
        date: '2026-02-15T15:00:00',
        format: 'Standard',
        entryFee: '$15',
        registered: 28,
        capacity: 50,
        color: 'border-geeko-blue',
        iconColor: 'text-geeko-blue'
    },
    {
        id: '3',
        name: 'One Piece Store Championship',
        game: 'One Piece TCG',
        date: '2026-02-21T14:00:00',
        format: 'Constructed',
        entryFee: '$20',
        registered: 64,
        capacity: 64,
        color: 'border-geeko-orange',
        iconColor: 'text-geeko-orange'
    }
];

const TournamentHub: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-geeko-gold/30 overflow-hidden">

            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-geeko-orange/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-geeko-blue/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            <div className="relative z-10 py-8 px-4">
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/10 pb-8">
                        <div className="space-y-2">
                            <h2 className="text-sm font-black text-geeko-gold uppercase tracking-[0.3em]">Competitive Play</h2>
                            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                                Geekorium <span className="neon-text-cyan">Arena</span>
                            </h1>
                            <p className="text-slate-400 max-w-xl">
                                Join the ultimate competitive experience. Earn ELO points, climb the ranks, and win exclusive prizes in our official sanctioned events.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/profile')}
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2"
                            >
                                <Users size={16} /> My Player Profile
                            </button>
                        </div>
                    </div>

                    {/* Featured Event Hero */}
                    <div className="relative rounded-3xl overflow-hidden glass-card border border-white/10 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-geeko-orange/20 to-transparent"></div>
                        <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="space-y-4 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-geeko-orange/20 border border-geeko-orange text-geeko-orange text-[10px] font-black uppercase tracking-widest">
                                    <Trophy size={12} /> Flagship Event
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic leading-none">
                                    One Piece <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-geeko-orange to-red-500">Grand Line Open</span>
                                </h2>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-slate-300 font-medium">
                                    <span className="flex items-center gap-2"><Calendar size={16} className="text-geeko-orange" /> March 1st, 2026</span>
                                    <span className="flex items-center gap-2"><MapPin size={16} className="text-geeko-orange" /> Geekorium Main Hall</span>
                                    <span className="flex items-center gap-2"><Swords size={16} className="text-geeko-orange" /> 128 Players Cap</span>
                                </div>
                            </div>
                            <button className="px-8 py-4 bg-geeko-orange text-black font-black uppercase tracking-widest hover:scale-105 transition-transform rounded-2xl shadow-[0_0_20px_rgba(247,119,55,0.4)]">
                                Register Now
                            </button>
                        </div>
                    </div>

                    {/* Upcoming Tournaments List */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white uppercase italic">Upcoming Events</h3>
                            <div className="flex gap-2">
                                {/* Filters could go here */}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {UPCOMING_TOURNAMENTS.map((tourney) => (
                                <div
                                    key={tourney.id}
                                    className={`group relative p-6 rounded-2xl bg-[#121212] border-l-4 ${tourney.color} hover:bg-[#1a1a1a] transition-all cursor-pointer flex flex-col md:flex-row justify-between items-center gap-6`}
                                >
                                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                        <div className={`p-4 rounded-2xl bg-white/5 ${tourney.iconColor}`}>
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{tourney.game}</div>
                                            <h4 className="text-xl font-bold text-white group-hover:text-geeko-gold transition-colors">{tourney.name}</h4>
                                            <div className="flex gap-4 mt-2 text-xs text-slate-400 font-medium justify-center md:justify-start">
                                                <span>{new Date(tourney.date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{tourney.format}</span>
                                                <span>•</span>
                                                <span>{tourney.entryFee}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden md:block">
                                            <div className="text-2xl font-black text-white italic">{tourney.registered}<span className="text-slate-600 text-lg">/{tourney.capacity}</span></div>
                                            <div className="text-[10px] uppercase font-bold text-slate-500">Players Registered</div>
                                        </div>
                                        <button className="w-full md:w-auto px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase text-xs transition-colors">
                                            Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentHub;
