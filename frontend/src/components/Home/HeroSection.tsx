import React, { useEffect, useState } from 'react';
import { fetchBanners } from '../../utils/api';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface Banner {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    category: string;
}

export const HeroSection: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHeroData = async () => {
            setLoading(true);
            try {
                // 1. Try fetching banners (Omni-TCG standard)
                const bannerData = await fetchBanners('main_hero').catch(err => {
                    console.warn("Banners fetch failed, falling back to cards:", err);
                    return [];
                });

                if (bannerData && bannerData.length > 0) {
                    setBanners(bannerData);
                } else {
                    // 2. Fallback to Premium Mock Banners for immediate visual impact
                    const MOCK_BANNERS: Banner[] = [
                        {
                            id: 'mock-1',
                            title: 'El Emporio de Geekorium',
                            subtitle: 'Tu destino premium para Singles de Magic: The Gathering. Stock real y actualizado diariamente.',
                            image_url: 'https://cards.scryfall.io/art_crop/front/d/1/d13cb0d3-3452-4c1f-81ec-024b4c45bbad.jpg',
                            link_url: '/?game=MTG',
                            category: 'main_hero'
                        },
                        {
                            id: 'mock-2',
                            title: 'Outlaws of Thunder Junction',
                            subtitle: 'Ya disponible el stock completo de la última edición. Encuentra los Breaking News aquí.',
                            image_url: 'https://cards.scryfall.io/art_crop/front/6/7/67f4c93b-080c-4196-b095-6a120a221988.jpg',
                            link_url: '/?game=MTG&set=OTJ',
                            category: 'main_hero'
                        },
                        {
                            id: 'mock-3',
                            title: 'Compramos tu Colección',
                            subtitle: 'Trae tus cartas y obtén crédito en tienda o efectivo. El mejor precio del mercado garantizado.',
                            image_url: 'https://cards.scryfall.io/art_crop/front/a/1/a1d9ae04-3747-4402-8608-8f85f36e479c.jpg',
                            link_url: '#',
                            category: 'main_hero'
                        }
                    ];
                    setBanners(MOCK_BANNERS);
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
        const length = banners.length;
        if (length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % length);
    };

    const prevSlide = () => {
        const length = banners.length;
        if (length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + length) % length);
    };

    if (loading) {
        return (
            <div className="w-full h-[400px] rounded-[2.5rem] bg-neutral-900/50 animate-pulse flex items-center justify-center border border-white/5">
                <span className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-xs">Initializing Neural Link...</span>
            </div>
        );
    }

    const currentItem = banners[currentIndex];

    if (!currentItem) return null;

    return (
        <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-700 h-[400px] md:h-[450px] bg-[#050505]">
            {/* Background Image with Blur/Gradient */}
            <div className="absolute inset-0 z-0">
                <img
                    src={currentItem.image_url}
                    alt=""
                    className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col md:flex-row items-center px-6 md:px-16 gap-6 md:gap-12">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left pt-12 md:pt-0">
                    <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
                        <span className="px-3 py-1 border rounded-full text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1.5 bg-pink-500/20 border-pink-500/30 text-pink-400">
                            <Zap size={10} fill="currentColor" /> Featured
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9] italic uppercase mb-4 md:mb-6 drop-shadow-2xl text-balance">
                        {currentItem.title}
                    </h2>

                    <p className="text-neutral-400 text-sm md:text-base max-w-xl font-medium mb-8 line-clamp-2">
                        {currentItem.subtitle}
                    </p>

                    {/* Explore button hidden as requested */}
                    {/* <div className="flex items-center gap-4 justify-center md:justify-start">
                        <a 
                            href={currentItem.link_url || '#'} 
                            className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-pink-500 hover:text-white transition-all transform active:scale-95 shadow-xl flex items-center gap-2"
                        >
                            Explore Now
                            <ExternalLink size={14} />
                        </a>
                    </div> */}
                </div>

                {/* Showcase */}
                <div className="hidden md:block w-72 h-[400px] relative perspective-1000 rotate-y-[-10deg] group-hover:rotate-y-0 transition-transform duration-1000">
                    <div className="w-full h-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative group/card">
                        <img
                            src={currentItem.image_url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                        />
                    </div>
                    <div className="absolute -bottom-10 inset-x-10 h-10 blur-[40px] rounded-full bg-pink-500/20" />
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
                {banners.map((_, i) => (
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
