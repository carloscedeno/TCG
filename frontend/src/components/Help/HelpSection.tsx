import React, { useState } from 'react';
import {
    Search,
    Filter,
    ChevronDown,
    Play,
} from 'lucide-react';
import {
    DiscoveryIcon,
    SelectionIcon,
    PreparationIcon,
    PactIcon,
    VideoPlaceholder
} from './HelpIcons';

export const HelpSection: React.FC = () => {
    const [activeFaq, setActiveFaq] = useState<string | null>(null);
    const [isVideoOpen, setIsVideoOpen] = useState(false);

    // Connector Path SVG Component
    const ConnectorPath = () => (
        <div className="absolute top-24 left-0 w-full h-24 hidden md:block -z-10 overflow-visible pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00E5FF" stopOpacity="0" />
                        <stop offset="15%" stopColor="#00E5FF" stopOpacity="0.5" />
                        <stop offset="50%" stopColor="#6D28D9" stopOpacity="0.5" />
                        <stop offset="85%" stopColor="#FFC107" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#FFC107" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Glowing Path */}
                <path d="M100,50 C350,50 350,50 600,50 C850,50 850,50 1100,50"
                    stroke="url(#pathGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="10 10"
                    className="animate-[shimmer_3s_linear_infinite]" />

                {/* Moving Particle */}
                <circle r="6" fill="#fff" filter="drop-shadow(0 0 8px #00E5FF)">
                    <animateMotion dur="4s" repeatCount="indefinite" path="M100,50 C350,50 350,50 600,50 C850,50 850,50 1100,50" />
                </circle>
            </svg>
        </div>
    );

    const steps = [
        {
            title: 'El Descubrimiento',
            desc: 'Usa los filtros de Mana Essence para encontrar cartas específicas.',
            icon: DiscoveryIcon,
            color: 'text-geeko-cyan'
        },
        {
            title: 'La Selección',
            desc: 'Añade al carrito y descubre tu ahorro exclusivo.',
            icon: SelectionIcon,
            color: 'text-geeko-purple'
        },
        {
            title: 'La Preparación',
            desc: 'Revisa tu botín en el cofre antes de finalizar.',
            icon: PreparationIcon,
            color: 'text-geeko-gold'
        },
        {
            title: 'El Pacto',
            desc: 'Finaliza vía WhatsApp con un Geeko-Asesor.',
            icon: PactIcon,
            color: 'text-green-500'
        }
    ];

    const faqs = [
        {
            id: 'search',
            category: 'Gremio de Buscadores',
            icon: Search,
            questions: [
                { q: '¿Cómo encuentro una carta específica?', a: 'Usa la barra de búsqueda superior. Puedes escribir el nombre completo o solo una parte.' },
                { q: '¿Qué diferencia hay entre Stock y Archivo?', a: 'Stock Geekorium son cartas listas para envío inmediato. Archivo es para referencia histórica.' }
            ]
        },
        {
            id: 'filters',
            category: 'El Alquimista de Filtros',
            icon: Filter,
            questions: [
                { q: '¿Cómo funcionan los filtros de Mana?', a: 'Permiten buscar cartas por sus colores y tipos de energía específicos.' },
                { q: '¿Qué es el Temporal Orbit?', a: 'Es nuestro sistema para filtrar por ediciones y legalidad en formatos.' }
            ]
        }
    ];

    return (
        <section className="py-20 bg-[#f4e4bc] relative overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-black italic tracking-tighter uppercase mb-4 drop-shadow-sm">
                        El Códice del Emporio
                    </h2>
                    <p className="text-black/70 font-medium max-w-2xl mx-auto text-lg">
                        Domina el arte de la búsqueda y la adquisición de tesoros en nuestro portal.
                    </p>
                </div>

                {/* Infographic Stepper with Path */}
                <div className="relative mb-24">
                    <ConnectorPath />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative group text-center z-10">
                                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-[#f4e4bc] border-4 border-white/50 flex items-center justify-center group-hover:scale-110 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] p-6 relative">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                                    <step.icon className={`w-full h-full ${step.color} drop-shadow-md`} />
                                </div>
                                <h3 className="text-xl font-black text-black italic uppercase mb-2">{step.title}</h3>
                                <p className="text-sm text-black/60 font-medium px-4">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video & FAQ Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Video Player Mockup with FAKE CONTENT AND INTERACTIVITY */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-4 bg-gradient-to-br from-geeko-cyan/20 to-geeko-purple/20 blur-2xl opacity-50 rounded-[4rem] group-hover:opacity-75 transition-opacity duration-500" />
                        <div
                            onClick={() => setIsVideoOpen(true)}
                            className="relative aspect-video bg-neutral-900 rounded-[2.5rem] border-[12px] border-[#2a2a2a] shadow-2xl overflow-hidden flex items-center justify-center cursor-pointer transform transition-transform duration-500 group-hover:rotate-x-2 group-hover:scale-[1.02]"
                        >
                            {/* Insert Video Placeholder Here */}
                            <VideoPlaceholder />

                            {/* Overlay Play Button */}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                <button className="w-24 h-24 rounded-full bg-geeko-cyan/90 backdrop-blur text-black flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.6)] group-hover:scale-110 transition-transform duration-300 border-4 border-white/20">
                                    <Play size={40} fill="currentColor" className="ml-2" />
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-8 text-white font-black italic tracking-tighter uppercase text-xl drop-shadow-lg">
                                Crónicas Visionarias: Tutorial
                            </div>
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-6">
                        {faqs.map((group) => (
                            <div key={group.id} className="bg-white/60 backdrop-blur-sm border border-black/5 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="p-6 bg-gradient-to-r from-white/50 to-transparent border-b border-black/5 flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-geeko-purple/10 text-geeko-purple">
                                        <group.icon size={24} />
                                    </div>
                                    <h3 className="text-lg font-black text-black italic uppercase tracking-tight">{group.category}</h3>
                                </div>
                                <div className="p-2 space-y-1">
                                    {group.questions.map((q, i) => (
                                        <div key={i} className="rounded-2xl hover:bg-black/5 transition-all">
                                            <button
                                                onClick={() => setActiveFaq(activeFaq === q.q ? null : q.q)}
                                                className="w-full p-4 flex items-center justify-between text-left group"
                                            >
                                                <span className="text-sm font-bold text-black/80 group-hover:text-geeko-purple transition-colors">{q.q}</span>
                                                <ChevronDown size={18} className={`text-black/40 transition-transform duration-300 ${activeFaq === q.q ? 'rotate-180 text-geeko-purple' : ''}`} />
                                            </button>
                                            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${activeFaq === q.q ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm text-black/60 font-medium leading-relaxed px-4 pb-4 pl-8 border-l-2 border-geeko-purple/20 ml-4 mb-2">
                                                        {q.a}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {isVideoOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                        <button
                            onClick={() => setIsVideoOpen(false)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-white/20 text-white transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                        <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                            title="Geekorium Tutorial"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </section>
    );
};
