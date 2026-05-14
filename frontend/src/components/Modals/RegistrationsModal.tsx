import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar as CalendarIcon, Download } from 'lucide-react';
import { adminFetchRegistrations } from '../../utils/api';

interface RegistrationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
}

export const RegistrationsModal: React.FC<RegistrationsModalProps> = ({ isOpen, onClose, event }) => {
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && event?.id) {
            loadRegistrations();
        }
    }, [isOpen, event]);

    const loadRegistrations = async () => {
        try {
            setLoading(true);
            const data = await adminFetchRegistrations(event.id);
            setRegistrations(data);
        } catch (error) {
            console.error('Error loading registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        const headers = ['Nombre', 'Email', 'Teléfono', 'Fecha Registro'];
        const rows = registrations.map(r => [
            r.full_name,
            r.email,
            r.phone,
            new Date(r.created_at).toLocaleString()
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `registrados_${event.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-neutral-900/50">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Gestión de Participantes</h3>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter">{event?.name}</h2>
                        {event?.description && (
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-2 max-w-xl line-clamp-2">
                                {event.description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={downloadCSV}
                            disabled={registrations.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-30"
                        >
                            <Download size={14} /> Exportar CSV
                        </button>
                        <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Cargando lista...</p>
                        </div>
                    ) : registrations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {registrations.map((reg) => (
                                <div key={reg.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-white">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white uppercase text-sm tracking-tight group-hover:text-white transition-colors">{reg.full_name}</h4>
                                                <div className="flex items-center gap-2 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                                                    <CalendarIcon size={10} /> {new Date(reg.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-2 pt-3 border-t border-white/5">
                                        <a href={`mailto:${reg.email}`} className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors">
                                            <Mail size={12} className="text-white" /> {reg.email}
                                        </a>
                                        <a href={`https://wa.me/${reg.phone.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors">
                                            <Phone size={12} className="text-white" /> {reg.phone}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <User size={48} className="text-neutral-800 mx-auto" />
                            <p className="text-sm font-bold text-neutral-600 uppercase tracking-widest">No hay registrados para este evento</p>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-neutral-900/50 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                        Total: <span className="text-white">{registrations.length}</span> Participantes
                    </p>
                </div>
            </div>
        </div>
    );
};
