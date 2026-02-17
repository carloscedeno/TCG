import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShoppingBag, MessageSquare, ChevronRight } from 'lucide-react';

export const WelcomeModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Mostrar el modal después de 1.5 segundos de cargar la página
        const timer = setTimeout(() => {
            const hasSeenModal = sessionStorage.getItem('hasSeenWelcomeModal');
            if (!hasSeenModal) {
                setIsOpen(true);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const closeMirror = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenWelcomeModal', 'true');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop con desenfoque profundo */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500"
                onClick={closeMirror}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-[#373266] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500 border-[4px] border-[#00AEB4]/30">

                {/* Decorative Pattern / Texture */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

                {/* Close Button */}
                <button
                    onClick={closeMirror}
                    className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/60 hover:text-white transition-all z-20 hover:rotate-90 duration-300"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Visual Side */}
                    <div className="md:w-2/5 relative bg-[#1F182D] flex items-center justify-center p-8 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00AEB4]/20 to-[#373266]/30 opacity-50" />
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00AEB4]/10 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />

                        <div className="relative z-10 text-center group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#00AEB4] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
                                <img
                                    src="/branding/Logo.jpg"
                                    alt="El Emporio"
                                    className="relative w-32 h-32 rounded-full border-4 border-[#00AEB4]/30 shadow-2xl mb-4 group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="flex items-center justify-center gap-1 text-[#00AEB4]">
                                <Sparkles size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic text-[#00AEB4]">Est. 2025</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center relative">
                        {/* Decorative line top */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00AEB4]/20 to-transparent"></div>

                        <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">
                            <span className="text-[#00AEB4] block text-base md:text-lg not-italic font-medium tracking-normal mb-1">Bienvenido a</span>
                            Geekorium<br />Emporio Mágico
                        </h2>

                        <div className="h-1 w-20 bg-[#00AEB4] mb-6 rounded-full shadow-[0_0_10px_#00AEB4]" />

                        <p className="text-white/90 font-medium text-sm md:text-base leading-relaxed mb-8">
                            Has entrado al <strong>Portafolio Online</strong> definitivo para coleccionistas. Explora nuestro inventario real, añade tus tesoros al carrito y finaliza tu misión con un Geeko-Asesor.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-[#00AEB4]/10 flex items-center justify-center text-[#00AEB4] shadow-sm shrink-0 border border-[#00AEB4]/20">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">Explora el Stock</h4>
                                    <p className="text-[11px] text-white/60 font-medium">Cartas reales listas para tu colección.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-[#00AEB4]/10 flex items-center justify-center text-[#00AEB4] shadow-sm shrink-0 border border-[#00AEB4]/20">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">Finaliza por WhatsApp</h4>
                                    <p className="text-[11px] text-white/60 font-medium">Atención personalizada con expertos.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={closeMirror}
                            className="mt-8 w-full py-4 bg-[#00AEB4] text-[#1F182D] font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#00AEB4]/90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(0,174,180,0.3)]"
                        >
                            Comenzar Misión <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
