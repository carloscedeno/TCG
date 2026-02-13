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
            <div className="relative w-full max-w-2xl bg-[#f4e4bc] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500 border-[8px] border-[#e2d1a6]">

                {/* Decorative Pattern / Texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

                {/* Close Button */}
                <button
                    onClick={closeMirror}
                    className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full text-black/40 hover:text-black transition-all z-20"
                >
                    <X size={24} />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Visual Side */}
                    <div className="md:w-2/5 relative bg-[#0a0a0a] flex items-center justify-center p-8 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-geeko-cyan/20 to-geeko-purple/30 opacity-50" />
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-geeko-cyan/20 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-geeko-purple/20 rounded-full blur-[80px]" />

                        <div className="relative z-10 text-center">
                            <img
                                src="/branding/Logo.jpg"
                                alt="El Emporio"
                                className="w-32 h-32 rounded-full border-4 border-white/10 shadow-2xl mb-4 animate-bounce-slow"
                            />
                            <div className="flex items-center justify-center gap-1 text-geeko-cyan">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Est. 2026</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                        <h2 className="text-4xl font-black text-black italic tracking-tighter uppercase mb-2 leading-none">
                            <span className="text-geeko-purple opacity-30 block text-lg not-italic lowercase mb-1">bienvenido al</span>
                            Geekorium<br />El Emporio
                        </h2>

                        <div className="h-1 w-20 bg-geeko-purple/20 mb-6 rounded-full" />

                        <p className="text-black/70 font-medium text-base leading-relaxed mb-8">
                            Has entrado al <strong>Portafolio Online</strong> definitivo para coleccionistas. Explora nuestro inventario real, añade tus tesoros al carrito y finaliza tu misión con un Geeko-Asesor.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-3 rounded-2xl bg-black/5 border border-black/5">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-geeko-purple shadow-sm shrink-0">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-black">Explora el Stock</h4>
                                    <p className="text-[11px] text-black/50 font-medium">Cartas reales listas para tu colección.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-3 rounded-2xl bg-black/5 border border-black/5">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-geeko-purple shadow-sm shrink-0">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase italic tracking-tighter text-black">Finaliza por WhatsApp</h4>
                                    <p className="text-[11px] text-black/50 font-medium">Atención personalizada con expertos.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={closeMirror}
                            className="mt-10 w-full py-4 bg-black text-[#f4e4bc] font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-geeko-purple transition-all flex items-center justify-center gap-2 group shadow-xl"
                        >
                            Comenzar Misión <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
