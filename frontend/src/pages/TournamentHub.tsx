import React from 'react';
import { Calendar, Trophy, Users, Swords, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { UserMenu } from '../components/Navigation/UserMenu';
import { useAuth } from '../context/AuthContext';
import { fetchEvents } from '../utils/api';
import { useEffect, useState } from 'react';

// Mock data for initial display (until we connect to Supabase real data)
// Fallback color mapping based on game code
const GAME_COLORS: Record<string, { border: string, text: string }> = {
    'MTG': { border: 'border-geeko-red', text: 'text-geeko-red' },
    'PKM': { border: 'border-geeko-blue', text: 'text-geeko-blue' },
    'OPC': { border: 'border-geeko-orange', text: 'text-geeko-orange' },
    'DGM': { border: 'border-geeko-purple', text: 'text-geeko-purple' },
    'YGO': { border: 'border-geeko-gold', text: 'text-geeko-gold' },
    'DEFAULT': { border: 'border-white/10', text: 'text-white' }
};

const TournamentHub: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                const data = await fetchEvents();
                setEvents(data);
            } catch (error) {
                console.error('Error loading events:', error);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    const getGameColors = (code: string) => GAME_COLORS[code] || GAME_COLORS.DEFAULT;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-geeko-gold/30 overflow-hidden">

            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-geeko-orange/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-geeko-blue/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            {/* Header */}
            <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl shadow-black/50 relative">
                <nav className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                            <div className="flex items-center justify-center font-black text-xl italic text-white shadow-lg shadow-blue-600/20">
                                <span className="text-geeko-cyan">El</span>&nbsp;Emporio
                            </div>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        {user && <UserMenu />}
                    </div>
                </nav>
            </header>

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

                    {/* Tournaments Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-[300px] bg-white/5 rounded-3xl animate-pulse" />
                            ))
                        ) : events.length > 0 ? (
                            events.map((tournament) => {
                                const colors = getGameColors(tournament.game_code);
                                return (
                                    <div 
                                        key={tournament.id} 
                                        className={`group rounded-3xl overflow-hidden glass-card border ${colors.border}/20 hover:${colors.border}/50 transition-all hover:scale-[1.02] cursor-pointer`}
                                    >
                                        <div className="relative h-40 bg-slate-900 overflow-hidden">
                                            {tournament.image_url ? (
                                                <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                                    <Trophy size={64} className={colors.text} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 left-4">
                                                <span className={`px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border ${colors.border}/30 ${colors.text} text-[10px] font-black uppercase tracking-widest`}>
                                                    {tournament.game_code}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <h3 className="text-xl font-black italic tracking-tighter uppercase line-clamp-1 group-hover:text-geeko-cyan transition-colors">
                                                    {tournament.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                                    <Calendar size={12} className="text-geeko-gold" />
                                                    {new Date(tournament.event_date).toLocaleDateString()} at {new Date(tournament.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <Swords size={12} /> Format
                                                    </div>
                                                    <div className="text-sm font-black text-white">{tournament.format}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                                        <Users size={12} /> Players
                                                    </div>
                                                    <div className="text-sm font-black text-white">{tournament.registered} / {tournament.capacity}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-2xl font-black italic text-geeko-gold">{tournament.entry_fee}</div>
                                                <button className="bg-white/5 hover:bg-white text-white hover:text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                    Register Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-500 uppercase tracking-tighter">No events found</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default TournamentHub;
