import React, { useState } from 'react';
import { MessageCircle, X, Send, Phone } from 'lucide-react';

export const WhatsAppWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const contactChannels = [
        {
            name: 'Atención Principal',
            number: '584128042832',
            description: 'Consultas generales y envíos',
            color: 'bg-geeko-cyan'
        },
        {
            name: 'Venta de Singles',
            number: '584242507802',
            description: 'Compra y venta de cartas sueltas',
            color: 'bg-geeko-purple'
        }
    ];

    const generateWhatsAppLink = (number: string) => {
        const message = encodeURIComponent('¡Hola Geekorium! Vengo desde la página web y me gustaría información.');
        return `https://wa.me/${number}?text=${message}`;
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            {/* Pop-up Menu */}
            {isOpen && (
                <div className="w-72 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-geeko-cyan/20 to-geeko-purple/20 p-6 border-b border-white/10">
                        <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">
                            Geeko-Asesoría
                        </h3>
                        <p className="text-xs text-neutral-400 font-medium">¿En qué podemos ayudarte hoy?</p>
                    </div>

                    {/* Channels List */}
                    <div className="p-4 space-y-3">
                        {contactChannels.map((channel) => (
                            <a
                                key={channel.number}
                                href={generateWhatsAppLink(channel.number)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-xl ${channel.color} flex items-center justify-center text-black shadow-lg`}>
                                    <Phone size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white group-hover:text-geeko-cyan transition-colors">
                                        {channel.name}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 font-medium">
                                        {channel.description}
                                    </div>
                                </div>
                                <Send size={14} className="text-neutral-600 group-hover:text-geeko-cyan transition-colors" />
                            </a>
                        ))}
                    </div>

                    {/* Footer Text */}
                    <div className="px-6 py-3 bg-black/40 text-center">
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                            Online 24/7 (Respuesta rápida)
                        </p>
                    </div>
                </div>
            )}

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 group relative ${isOpen
                        ? 'bg-neutral-800 text-white rotate-90'
                        : 'bg-geeko-cyan text-black hover:scale-110'
                    }`}
                title="Contactar por WhatsApp"
            >
                {/* Pulse Effect when closed */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-geeko-cyan animate-ping opacity-20 pointer-events-none" />
                )}

                {isOpen ? (
                    <X size={28} />
                ) : (
                    <MessageCircle size={28} fill="currentColor" strokeWidth={0} />
                )}

                {/* Badge for Attention */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#121212] flex items-center justify-center animate-bounce">
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    </span>
                )}
            </button>
        </div>
    );
};
