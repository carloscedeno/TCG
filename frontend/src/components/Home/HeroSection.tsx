import React, { useEffect, useState } from 'react';
import { fetchBanners } from '../../utils/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
                const bannerData = await fetchBanners('main_hero').catch(err => {
                    console.warn("Banners fetch failed, falling back to mock:", err);
                    return [];
                });

                if (bannerData && bannerData.length > 0) {
                    setBanners(bannerData);
                } else {
                    const MOCK_BANNERS: Banner[] = [
                        {
                            id: 'mock-1',
                            title: 'El Emporio de Geekorium',
                            subtitle: 'Tu destino premium para Singles de Magic: The Gathering.',
                            image_url: 'https://cards.scryfall.io/art_crop/front/d/1/d13cb0d3-3452-4c1f-81ec-024b4c45bbad.jpg',
                            link_url: '/?game=MTG',
                            category: 'main_hero'
                        },
                        {
                            id: 'mock-2',
                            title: 'Outlaws of Thunder Junction',
                            subtitle: 'Stock completo de la última edición disponible.',
                            image_url: 'https://cards.scryfall.io/art_crop/front/6/7/67f4c93b-080c-4196-b095-6a120a221988.jpg',
                            link_url: '/?game=MTG&set=OTJ',
                            category: 'main_hero'
                        },
                        {
                            id: 'mock-3',
                            title: 'Compramos tu Colección',
                            subtitle: 'Trae tus cartas y obtén crédito en tienda o efectivo.',
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

    // Auto-advance every 6 seconds
    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [banners.length]);

    const nextSlide = () => {
        if (banners.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        if (banners.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-6 w-64 bg-neutral-800/50 rounded-lg animate-pulse" />
                <div className="w-full aspect-[3.5/1] rounded-2xl bg-neutral-900/50 animate-pulse flex items-center justify-center border border-white/5">
                    <span className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-xs">Cargando...</span>
                </div>
            </div>
        );
    }

    const currentItem = banners[currentIndex];
    if (!currentItem) return null;

    return (
        <div className="space-y-3">
            {/* Title & Subtitle OUTSIDE the banner */}
            <div className="px-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                    {currentItem.title}
                </h2>
                {currentItem.subtitle && (
                    <p className="text-xs sm:text-sm text-neutral-400 font-medium mt-1 max-w-2xl">
                        {currentItem.subtitle}
                    </p>
                )}
            </div>

            {/* Banner Image — fixed 3.5:1 ratio, image fills the frame */}
            <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#050505]">
                <a
                    href={currentItem.link_url || '#'}
                    className="block w-full aspect-[3.5/1]"
                >
                    <img
                        src={currentItem.image_url}
                        alt={currentItem.title || 'Banner'}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                </a>

                {/* Navigation arrows — subtle, inside the banner */}
                {banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); prevSlide(); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/60 hover:border-geeko-cyan/50 transition-all z-20"
                        >
                            <ChevronLeft size={18} className="text-white" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); nextSlide(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/60 hover:border-geeko-cyan/50 transition-all z-20"
                        >
                            <ChevronRight size={18} className="text-white" />
                        </button>
                    </>
                )}

                {/* Indicators — bottom center */}
                {banners.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.preventDefault(); setCurrentIndex(i); }}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex
                                    ? 'w-8 bg-geeko-cyan shadow-[0_0_8px_rgba(0, 153, 255, 0.6)]'
                                    : 'w-3 bg-white/30 hover:bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
