import React, { useEffect, useState } from 'react';
import { fetchEvents } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export const UpcomingMissionsWidget: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const data = await fetchEvents();
                // Only take the next 6 events
                setEvents(data.slice(0, 6));
            } catch (error) {
                console.error("Failed to load events", error);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);


    const getGameColor = (gameCode: string) => {
        switch (gameCode) {
            case 'MTG': return 'text-orange-500';
            case 'PKM': return 'text-yellow-500';
            case 'YGO': return 'text-amber-600';
            case 'DGM': return 'text-blue-500';
            case 'OPC': return 'text-red-500';
            case 'FAB': return 'text-purple-500';
            default: return 'text-white';
        }
    };

    if (loading) {
        return (
            <div className="w-72 bg-neutral-900/50 rounded-2xl border border-white/5 p-4 animate-pulse h-96"></div>
        );
    }

    if (events.length === 0) {
        return null; // Don't show the widget if there are no events
    }

    return (
        <div className="w-full flex flex-col gap-3">
            <div className="border border-[#00D1FF]/30 rounded-lg p-3 text-center bg-gradient-to-r from-transparent via-[#00D1FF]/5 to-transparent mb-2">
                <h3 className="text-white text-xs font-black uppercase tracking-widest">Próximas Misiones</h3>
            </div>
            
            <div className="flex flex-col gap-2">
                {events.map(event => {
                    const date = new Date(event.event_date);
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
                    const dateString = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
                    
                    return (
                        <div 
                            key={event.id}
                            onClick={() => navigate('/tournaments')}
                            className="flex items-center gap-4 bg-gradient-to-r from-neutral-900/80 to-black border border-white/5 rounded-xl p-3 cursor-pointer hover:border-white/20 transition-all hover:translate-x-1 group"
                        >
                            {/* Game Icon / Code Indicator */}
                            <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-black text-[9px] border border-white/10 group-hover:bg-white/10 ${getGameColor(event.game_code)}`}>
                                {event.game_code}
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="text-white font-black text-[10px] uppercase tracking-wider">
                                    {dayName} {dateString}
                                </span>
                                <span className="text-neutral-400 text-[11px] font-medium leading-tight group-hover:text-white transition-colors">
                                    {event.name}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
