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
                    <h2 className="text-5xl font-black text-black italic tracking-tighter uppercase mb-4">
                        El Códice del Emporio
                    </h2>
                    <p className="text-black/60 font-medium max-w-2xl mx-auto">
                        Domina el arte de la búsqueda y la adquisición de tesoros en nuestro portal.
                    </p>
                </div>

                {/* Infographic Stepper */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-24">
                    {steps.map((step, idx) => (
                        <div key={idx} className="relative group text-center">
                            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-black/5 border-4 border-black/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all shadow-xl p-6">
                                <step.icon className={`w-full h-full ${step.color}`} />
                            </div>
                            <h3 className="text-xl font-black text-black italic uppercase mb-2">{step.title}</h3>
                            <p className="text-sm text-black/60 font-medium px-4">{step.desc}</p>
                            {idx < 3 && (
                                <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-black/10" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Video & FAQ Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Video Player Mockup with FAKE CONTENT */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-br from-geeko-cyan/20 to-geeko-purple/20 blur-2xl opacity-50 rounded-[4rem]" />
                        <div className="relative aspect-video bg-neutral-900 rounded-[2.5rem] border-[12px] border-neutral-800 shadow-2xl overflow-hidden flex items-center justify-center">
                            {/* Insert Video Placeholder Here */}
                            <VideoPlaceholder />

                            {/* Overlay Play Button */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-center justify-center cursor-pointer">
                                <button className="w-20 h-20 rounded-full bg-geeko-cyan text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:scale-110 transition-transform">
                                    <Play size={32} fill="currentColor" />
                                </button>
                            </div>
                            <div className="absolute bottom-6 left-6 text-white font-black italic tracking-tighter uppercase text-lg">
                                Crónicas Visionarias: Tutorial
                            </div>
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-6">
                        {faqs.map((group) => (
                            <div key={group.id} className="bg-white/40 border border-black/10 rounded-3xl overflow-hidden shadow-sm">
                                <div className="p-6 bg-black/5 border-b border-black/5 flex items-center gap-4">
                                    <group.icon className="text-geeko-purple" size={24} />
                                    <h3 className="text-lg font-black text-black italic uppercase tracking-tight">{group.category}</h3>
                                </div>
                                <div className="p-2 space-y-1">
                                    {group.questions.map((q, i) => (
                                        <div key={i} className="rounded-2xl hover:bg-black/5 transition-all">
                                            <button
                                                onClick={() => setActiveFaq(activeFaq === q.q ? null : q.q)}
                                                className="w-full p-4 flex items-center justify-between text-left group"
                                            >
                                                <span className="text-sm font-bold text-black group-hover:text-geeko-purple transition-colors">{q.q}</span>
                                                <ChevronDown size={18} className={`text-black/30 transition-transform ${activeFaq === q.q ? 'rotate-180' : ''}`} />
                                            </button>
                                            {activeFaq === q.q && (
                                                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                                    <p className="text-sm text-black/60 font-medium leading-relaxed pl-4 border-l-2 border-geeko-purple/20">
                                                        {q.a}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
