import React, { useState, useEffect } from 'react';
import { X, Sparkles, Search, ShoppingCart, Package, Handshake, ChevronRight } from 'lucide-react';

const MISSION_STEPS = [
    {
        icon: Search,
        title: 'Descubrimiento',
        subtitle: 'Explora nuestro inventario real de cartas.',
    },
    {
        icon: ShoppingCart,
        title: 'Selección',
        subtitle: 'Añade tus tesoros al carrito.',
    },
    {
        icon: Package,
        title: 'Preparación',
        subtitle: 'Tu pedido, listo y verificado para ti.',
    },
    {
        icon: Handshake,
        title: 'El Pacto',
        subtitle: 'Finaliza con un Geeko-Asesor por WhatsApp.',
    },
];

export const WelcomeModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Banner toggle - Set to true to re-enable
    const ENABLED = false;

    useEffect(() => {
        if (!ENABLED) return;
        const timer = setTimeout(() => {
            const hasSeenModal = sessionStorage.getItem('hasSeenWelcomeModal');
            if (!hasSeenModal) {
                setIsOpen(true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [ENABLED]);

    const closeMirror = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenWelcomeModal', 'true');
    };

    if (!ENABLED || !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500"
                onClick={closeMirror}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-[#373266] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-500 border-[4px] border-[#00AEB4]/30">

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
                                <div className="absolute inset-0 bg-[#00AEB4] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                                <img
                                    src="/branding/Logo.png"
                                    alt="El Emporio"
                                    className="relative w-48 object-contain shadow-2xl mb-4 group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {/* Est. 2025 — Rubik SemiBold */}
                            <div className="flex items-center justify-center gap-1 text-[#00AEB4]">
                                <Sparkles size={14} className="animate-pulse" />
                                <span
                                    className="text-[10px] uppercase tracking-[0.3em] italic text-[#00AEB4]"
                                    style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                                >Est. 2025</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-center relative">
                        {/* Decorative line top */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00AEB4]/20 to-transparent" />

                        {/* "bienvenido al" — Rubik SemiBold */}
                        <span
                            className="block text-sm not-italic tracking-normal mb-2 text-[#00AEB4]"
                            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                        >bienvenido al</span>

                        {/* Logo imagen — reemplaza el texto */}
                        <img
                            src="/branding/Logo.png"
                            alt="Geekorium"
                            className="w-32 object-contain object-left mb-4"
                        />

                        <div className="h-1 w-20 bg-[#00AEB4] mb-5 rounded-full shadow-[0_0_10px_#00AEB4]" />

                        {/* Body text — Rubik Regular */}
                        <p
                            className="text-white/90 text-sm leading-relaxed mb-6"
                            style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}
                        >
                            Has entrado al <strong style={{ fontWeight: 600 }}>Portafolio Online</strong> definitivo para coleccionistas. Sigue los pasos de tu misión:
                        </p>

                        {/* 4 Mission Steps */}
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {MISSION_STEPS.map(({ icon: Icon, title, subtitle }) => (
                                <div
                                    key={title}
                                    className="flex items-start gap-2 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-[#00AEB4]/10 flex items-center justify-center text-[#00AEB4] shrink-0 border border-[#00AEB4]/20">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        {/* Título etapa — DAITO */}
                                        <h4
                                            className="text-xs uppercase italic tracking-tight text-white font-black leading-tight"
                                            style={{ fontFamily: 'var(--font-logo)' }}
                                        >{title}</h4>
                                        {/* Subtítulo — Rubik Regular */}
                                        <p
                                            className="text-[10px] text-white/55 mt-0.5 leading-snug"
                                            style={{ fontFamily: 'var(--font-body)', fontWeight: 400 }}
                                        >{subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA — DAITO */}
                        <button
                            onClick={closeMirror}
                            className="w-full py-4 bg-[#00AEB4] text-[#1F182D] font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#00AEB4]/90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(0,174,180,0.3)]"
                            style={{ fontFamily: 'var(--font-logo)' }}
                        >
                            Comenzar Misión <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
