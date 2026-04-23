import React, { useEffect, useState } from 'react';
import { fetchCards, fetchBanners } from '../../utils/api';
import type { CardApi } from '../../utils/api';
import { ChevronLeft, ChevronRight, Zap, ExternalLink } from 'lucide-react';

interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    category: string;
}

export const HeroSection: React.FC = () => {
    const [trendingCards, setTrendingCards] = useState<CardApi[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHeroData = async () => {
            setLoading(true);
            try {
                // Try fetching banners
                const bannerData = await fetchBanners('main_hero').catch(err => {
                    console.warn("Banners table not available yet, falling back to cards:", err);
                    return null;
                });

                if (bannerData && bannerData.length > 0) {
                    setBanners(bannerData);
                } else {
                    // Fallback to trending cards (latest releases)
                    const { cards } = await fetchCards({ limit: 5, sort: 'release_date' }).catch(err => {
                        console.error("Cards fallback failed:", err);
                        return { cards: [] };
                    });
                    setTrendingCards(cards);
                    // If still empty, try one more time with default sort
                    if (!cards || cards.length === 0) {
                        const { cards: fallbackCards } = await fetchCards({ limit: 5 }).catch(() => ({ cards: [] }));
                        setTrendingCards(fallbackCards);
                    }
                }
            } catch (err) {
                console.error("Critical Hero data load error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadHeroData();
    }, []);

    const nextSlide = () => {
        const length = banners.length > 0 ? banners.length : trendingCards.length;
        setCurrentIndex((prev) => (prev + 1) % length);
    };

    const prevSlide = () => {
        const length = banners.length > 0 ? banners.length : trendingCards.length;
        setCurrentIndex((prev) => (prev - 1 + length) % length);
    };

    if (loading) {
        return (
            <div className="w-full h-[400px] rounded-[2.5rem] bg-neutral-900/50 animate-pulse flex items-center justify-center border border-white/5">
                <span className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-xs">Sincronizando Bóveda de Contenido...</span>
            </div>
        );
    }

    const hasBanners = banners.length > 0;
    const currentItem = hasBanners ? banners[currentIndex] : (trendingCards[currentIndex] as any);

    if (!currentItem) return null;

    return (
        <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 h-[400px] md:h-[500px] bg-[#050505]">
            {/* Background Image with Blur/Gradient */}
            <div className="absolute inset-0 z-0">
                <img
                    src={currentItem.image_url}
                    alt=""
                    className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col md:flex-row items-center px-6 md:px-16 gap-6 md:gap-12">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left pt-12 md:pt-0">
                    <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
                        <span className="px-3 py-1 bg-pink-500/20 border border-pink-500/30 rounded-full text-[10px] font-black tracking-[0.2em] text-pink-400 uppercase flex items-center gap-1.5">
                            <Zap size={10} fill="currentColor" /> {hasBanners ? "Destacado" : "Novedad"}
                        </span>
                        {!hasBanners && <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{currentItem.set}</span>}
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9] italic uppercase mb-4 md:mb-6 drop-shadow-2xl text-balance">
                        {hasBanners ? currentItem.title : currentItem.name.split('//')[0]}
                    </h2>

                    <p className="text-neutral-300 text-sm md:text-lg max-w-xl font-medium mb-8 line-clamp-3">
                        {hasBanners ? currentItem.subtitle : `${currentItem.type} — Descubre las últimas adiciones a la colección ${currentItem.set}.`}
                    </p>

                    <div className="flex items-center gap-4 justify-center md:justify-start">
                        {hasBanners ? (
                            <a 
                                href={currentItem.link_url || '#'} 
                                className="group/btn px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-pink-500 hover:text-white transition-all transform active:scale-95 shadow-2xl flex items-center gap-3"
                                target={currentItem.link_url?.startsWith('http') ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                            >
                                Explorar Ahora
                                <ExternalLink size={16} className="group-hover/btn:rotate-12 transition-transform" />
                            </a>
                        ) : (
                            <>
                                <button className="px-10 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-geeko-cyan hover:text-white transition-all transform active:scale-95 shadow-2xl">
                                    Ver Detalles
                                </button>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Market Value</span>
                                    <span className="text-2xl font-mono font-black text-geeko-cyan italic">${currentItem.price.toFixed(2)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Visual Showcase */}
                <div className="hidden lg:block w-96 h-[400px] relative perspective-1000 rotate-y-[-10deg] group-hover:rotate-y-0 transition-transform duration-1000">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(236,72,153,0.15)] border border-white/10 relative group/card">
                        <img
                            src={currentItem.image_url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    {/* Ambient Glow */}
                    <div className={`absolute -bottom-10 inset-x-10 h-10 blur-[60px] rounded-full ${hasBanners ? 'bg-pink-500/30' : 'bg-geeko-cyan/30'}`} />
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-10 right-10 flex gap-4 z-20">
                <button
                    onClick={prevSlide}
                    className="w-14 h-14 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 hover:border-pink-500/50 transition-all group shadow-xl"
                >
                    <ChevronLeft className="group-hover:text-pink-500 group-hover:-translate-x-0.5 transition-all" size={24} />
                </button>
                <button
                    onClick={nextSlide}
                    className="w-14 h-14 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-center hover:bg-white/10 hover:border-pink-500/50 transition-all group shadow-xl"
                >
                    <ChevronRight className="group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all" size={24} />
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-10 left-10 md:left-16 flex gap-3 z-20">
                {(hasBanners ? banners : trendingCards).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-700 ${i === currentIndex ? 'w-12 bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'w-3 bg-white/10'}`}
                    />
                ))}
            </div>
        </div>
    );
};
