import React, { useEffect, useState } from 'react';
import { Calendar, Trophy, Users, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchEvents, fetchCart } from '../utils/api';
import { Header } from '../components/Navigation/Header';
import { Footer } from '../components/Navigation/Footer';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { PreRegistrationModal } from '../components/Modals/PreRegistrationModal';
import { RankingWidget } from '../components/Rankings/RankingWidget';

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
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [eventsData, cartData] = await Promise.all([
                    fetchEvents(),
                    fetchCart()
                ]);
                setEvents(eventsData);
                
                const count = Array.isArray(cartData?.items)
                    ? cartData.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
                    : 0;
                setCartCount(count);
            } catch (error) {
                console.error('Error loading tournament hub data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getGameColors = (code: string) => GAME_COLORS[code] || GAME_COLORS.DEFAULT;

    return (
        <div className="min-h-screen bg-geeko-black text-white font-sans relative selection:bg-white/30">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-geeko-purple-vibrant/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

                <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-12 space-y-12">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-12">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black text-white uppercase tracking-[0.4em]">Próximas Misiones</h2>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.85]">
                                Geekorium <br /><span className="text-white">Arena</span>
                            </h1>
                            <p className="text-neutral-500 max-w-xl font-medium">
                                Únete a la experiencia competitiva definitiva. Gana puntos, sube en el ranking y obtén premios exclusivos en nuestros eventos oficiales.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/profile')}
                                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-3 group"
                            >
                                <Users size={16} className="group-hover:text-white transition-colors" /> Mi Perfil de Jugador
                            </button>
                        </div>
                    </div>

                    {/* Leaderboards Section */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Ranking Oficial TCG</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <RankingWidget gameContext="yugioh" />
                            <RankingWidget gameContext="onepiece" />
                        </div>
                    </div>

                    {/* Events Grid */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Calendario de Torneos</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {loading ? (
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="h-[400px] bg-white/[0.02] border border-white/5 rounded-3xl animate-pulse" />
                                ))
                            ) : events.length > 0 ? (
                                events.map((tournament) => {
                                    const colors = getGameColors(tournament.game_code);
                                    return (
                                        <div 
                                            key={tournament.id} 
                                            className={`group rounded-3xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-white/30 transition-all hover:scale-[1.02] duration-500`}
                                        >
                                            <div className="relative h-48 bg-neutral-900 overflow-hidden">
                                                {tournament.image_url ? (
                                                    <img src={tournament.image_url} alt={tournament.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                                        <Trophy size={80} className={colors.text} />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 ${colors.text} text-[10px] font-black uppercase tracking-widest`}>
                                                        {tournament.game_code}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="p-8 space-y-6">
                                                <div>
                                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase line-clamp-2 group-hover:text-white transition-colors duration-300">
                                                        {tournament.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-3">
                                                        <Calendar size={14} className="text-white" />
                                                        {new Date(tournament.event_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                                                    </div>
                                                </div>

                                                {tournament.description && (
                                                    <p className="text-xs text-neutral-400 font-medium line-clamp-3 leading-relaxed">
                                                        {tournament.description}
                                                    </p>
                                                )}

                                                <div className="grid grid-cols-2 gap-6 py-6 border-y border-white/5">
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Swords size={12} /> Formato
                                                        </div>
                                                        <div className="text-[13px] font-black text-white uppercase">{tournament.format}</div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] text-neutral-600 font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Users size={12} /> Jugadores
                                                        </div>
                                                        <div className="text-[13px] font-black text-white uppercase">{tournament.registered || 0} / {tournament.capacity || 64}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="text-3xl font-black italic text-white leading-none">
                                                        {tournament.entry_fee}
                                                    </div>
                                                    <button 
                                                        onClick={() => setSelectedEvent(tournament)}
                                                        className="flex-1 bg-white hover:bg-white text-black px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-lg shadow-white/10"
                                                    >
                                                        Pre-inscribirme
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-32 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10 space-y-6">
                                    <Calendar className="w-20 h-20 text-neutral-800 mx-auto" />
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-neutral-500 uppercase italic tracking-tighter">No hay eventos próximos</h3>
                                        <p className="text-neutral-600 text-sm font-medium">Estamos preparando nuevas misiones. ¡Vuelve pronto!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <Footer />
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <PreRegistrationModal 
                isOpen={selectedEvent !== null} 
                onClose={() => setSelectedEvent(null)} 
                event={selectedEvent} 
            />
        </div>
    );
};

export default TournamentHub;
