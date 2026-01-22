import React, { useEffect, useState } from 'react';
import { fetchCards } from '../../utils/api';
import type { CardApi } from '../../utils/api';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export const HeroSection: React.FC = () => {
    const [trendingCards, setTrendingCards] = useState<CardApi[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCards({ limit: 5, sort: 'release_date' })
            .then(({ cards }) => {
                setTrendingCards(cards);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % trendingCards.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + trendingCards.length) % trendingCards.length);
    };

    if (loading) {
        return (
            <div className="w-full h-[400px] rounded-[2.5rem] bg-neutral-900/50 animate-pulse flex items-center justify-center border border-white/5">
                <span className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-xs">Initializing Neural Link...</span>
            </div>
        );
    }

    if (trendingCards.length === 0) return null;

    const currentCard = trendingCards[currentIndex];

    return (
        <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 h-[450px] bg-[#050505]">
            {/* Background Image with Blur/Gradient */}
            <div className="absolute inset-0 z-0">
                <img
                    src={currentCard.image_url}
                    alt=""
                    className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col md:flex-row items-center px-8 md:px-16 gap-12">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left pt-12 md:pt-0">
                    <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-geeko-cyan/20 border border-geeko-cyan/30 rounded-full text-[10px] font-black tracking-[0.2em] text-geeko-cyan uppercase flex items-center gap-1.5">
                            <Zap size={10} fill="currentColor" /> New Arrival
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{currentCard.set}</span>
                    </div>

                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] italic uppercase mb-6 drop-shadow-2xl">
                        {currentCard.name.split('//')[0]}
                    </h2>

                    <p className="text-neutral-400 text-sm md:text-base max-w-md font-medium mb-8 line-clamp-2">
                        {currentCard.type} — Explore the latest additions to the {currentCard.set} collection. Real-time market valuation and stock tracking enabled.
                    </p>

                    <div className="flex items-center gap-4 justify-center md:justify-start">
                        <button className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-geeko-cyan hover:text-white transition-all transform active:scale-95 shadow-xl">
                            View Details
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Market Value</span>
                            <span className="text-2xl font-mono font-black text-geeko-cyan italic">${currentCard.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Card Showcase */}
                <div className="hidden md:block w-72 h-[400px] relative perspective-1000 rotate-y-[-10deg] group-hover:rotate-y-0 transition-transform duration-1000">
                    <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative group/card">
                        <img
                            src={currentCard.image_url}
                            alt={currentCard.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                        />
                        <div className="absolute inset-0 foil-shimmer opacity-30 pointer-events-none" />
                    </div>

                    {/* Shadow/Glow under card */}
                    <div className="absolute -bottom-10 inset-x-10 h-10 bg-geeko-cyan/20 blur-[40px] rounded-full" />
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-10 right-10 flex gap-4 z-20">
                <button
                    onClick={prevSlide}
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-geeko-cyan transition-all group"
                >
                    <ChevronLeft className="group-hover:text-geeko-cyan group-hover:-translate-x-0.5 transition-all" size={20} />
                </button>
                <button
                    onClick={nextSlide}
                    className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-geeko-cyan transition-all group"
                >
                    <ChevronRight className="group-hover:text-geeko-cyan group-hover:translate-x-0.5 transition-all" size={20} />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-10 left-10 md:left-16 flex gap-2 z-20">
                {trendingCards.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-8 bg-geeko-cyan' : 'w-2 bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    );
};
