import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserMissions } from '../../utils/api';
import { Loader2, Calendar, Tag } from 'lucide-react';

export const MyMissionsList: React.FC = () => {
    const { user } = useAuth();
    const [missions, setMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMissions = async () => {
            if (!user) return;
            try {
                const data = await fetchUserMissions(user.id, user.email);
                setMissions(data);
            } catch (error) {
                console.error("Failed to load missions:", error);
            } finally {
                setLoading(false);
            }
        };
        loadMissions();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-geeko-gold" size={32} />
            </div>
        );
    }

    if (missions.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">AÚN NO TE HAS INSCRITO EN NINGUNA MISIÓN</p>
                <p className="text-neutral-500 text-xs mt-2">Visita la pestaña de Misiones para ver los próximos eventos y torneos.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {missions.map((reg) => {
                const event = reg.events;
                if (!event) return null;

                const eventDate = new Date(event.event_date);
                const isPast = eventDate < new Date();
                const isCancelled = !event.is_active;
                
                let statusBadge = null;
                if (isCancelled) {
                    statusBadge = <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-black uppercase tracking-wider">CANCELADA</span>;
                } else if (isPast) {
                    statusBadge = <span className="px-2 py-1 bg-neutral-500/20 text-neutral-400 border border-neutral-500/30 rounded text-[10px] font-black uppercase tracking-wider">FINALIZADA</span>;
                } else {
                    statusBadge = <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-black uppercase tracking-wider">ACTIVA</span>;
                }

                // Temporary logic for payment status (will default to PENDING for most until we use it fully)
                const paymentStatus = reg.payment_status || 'PENDING';
                let paymentBadge = null;
                if (!isPast && !isCancelled) {
                    if (paymentStatus === 'PAID') {
                        paymentBadge = <span className="px-2 py-1 bg-geeko-gold/20 text-geeko-gold border border-geeko-gold/30 rounded text-[10px] font-black uppercase tracking-wider">PAGADO</span>;
                    } else if (paymentStatus === 'PENDING') {
                        paymentBadge = <span className="px-2 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-[10px] font-black uppercase tracking-wider">POR PAGAR</span>;
                    }
                }

                return (
                    <div key={reg.id} className={`bg-[#0a0a0a] border ${isPast ? 'border-white/5 opacity-70' : 'border-white/10'} rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col`}>
                        {event.image_url ? (
                            <div className="w-full h-32 overflow-hidden relative">
                                <img src={event.image_url} alt={event.name} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
                                <div className="absolute bottom-3 left-4 flex gap-2">
                                    {statusBadge}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-20 bg-neutral-900 relative">
                                <div className="absolute bottom-3 left-4 flex gap-2">
                                    {statusBadge}
                                </div>
                            </div>
                        )}
                        
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2 line-clamp-2">{event.name}</h3>
                            
                            <div className="space-y-2 mt-auto">
                                <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
                                    <Calendar size={14} className="text-geeko-gold" />
                                    <span>{eventDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                
                                {event.format && (
                                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-medium">
                                        <Tag size={14} className="text-geeko-cyan" />
                                        <span>Formato: {event.format}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                                    <div className="text-xs font-black uppercase tracking-widest text-neutral-500">
                                        Entrada: <span className="text-white">{event.entry_fee || 'Gratis'}</span>
                                    </div>
                                    {paymentBadge}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
