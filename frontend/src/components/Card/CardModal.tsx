import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';

interface CardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string | null;
}

interface CardFace {
    image_url?: string;
    image_uris?: {
        small?: string;
        normal?: string;
        large?: string;
        png?: string;
        border_crop?: string;
    };
    name: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
}

interface Version {
    printing_id: string;
    set_name: string;
    set_code: string;
    collector_number: string;
    rarity: string;
    price: number;
    image_url: string;
}

interface CardDetails {
    card_id: string;
    name: string;
    mana_cost: string;
    type: string;
    oracle_text: string;
    flavor_text: string;
    artist: string;
    rarity: string;
    set: string;
    set_code: string;
    collector_number: string;
    image_url: string;
    price: number;
    valuation?: {
        store_price: number;
        market_price: number;
        market_url?: string;
        valuation_avg: number;
    };
    legalities: Record<string, string>;
    colors: string[];
    card_faces?: CardFace[];
    all_versions?: Version[];
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, cardId }) => {
    const [details, setDetails] = useState<CardDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [activePrintingId, setActivePrintingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && cardId) {
            setActivePrintingId(cardId);
            loadCardDetails(cardId);
            // Lock background scroll
            document.body.style.overflow = 'hidden';
        } else {
            setDetails(null);
            setActivePrintingId(null);
            // Unlock background scroll
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, cardId]);


    const loadCardDetails = async (id: string) => {
        setLoading(true);
        setCurrentFaceIndex(0);

        try {
            const data = await fetchCardDetails(id);
            if (!data) throw new Error("No data found");
            setDetails(data);
        } catch (err) {
            console.error("Failed to load details", err);
        } finally {
            setLoading(false);
        }
    };

    const handleVersionClick = (id: string, e?: React.MouseEvent) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            return; // Allow native browser behavior for ctrl+click if it's a link
        }
        if (id !== activePrintingId) {
            setActivePrintingId(id);
            loadCardDetails(id);
        }
    };

    const handleAddToCart = async () => {
        if (!activePrintingId) return;
        setIsAdding(true);
        try {
            // Nota: product_id en el backend se refiere al id único en la tabla products
            // Si estamos en archives (catálogo), necesitamos primero mapear o asegurar que existe el producto.
            // Para este MVP, asumimos que activePrintingId puede ser usado o mapeado.
            await addToCart(activePrintingId, 1);
        } catch (err) {
            console.error("Cart error", err);
        } finally {
            setIsAdding(true); // Fake delay for UX
            setTimeout(() => setIsAdding(false), 800);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Removal of icon-based legality indicators in favor of color-coded boxes.

    const relevantFormats = ['standard', 'pioneer', 'modern', 'legacy', 'commander', 'pauper'];

    const currentImage = (() => {
        if (details?.card_faces && details.card_faces.length > 0) {
            const face = details.card_faces[currentFaceIndex];
            if (face?.image_uris) {
                return face.image_uris.normal || face.image_uris.large || face.image_uris.png;
            }
        }
        return details?.image_url;
    })();

    const hasMultipleFaces = details?.card_faces && details.card_faces.length > 1;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-6 animate-in fade-in zoom-in-95 duration-300 overflow-y-auto md:overflow-hidden"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-6xl min-h-full md:min-h-0 md:h-[90vh] md:max-h-[850px] glass-panel md:rounded-[32px] border-x-0 md:border border-white/10 shadow-[0_0_100px_rgba(0,163,255,0.15)] flex flex-col md:flex-row md:overflow-hidden">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400">
                    <X size={24} />
                </button>

                {/* LEFT: IMAGE & VERSIONS LIST */}
                <div className="w-full md:w-[420px] lg:w-[480px] bg-[#0c0c0c] flex flex-col border-r border-white/5 overflow-hidden shrink-0 h-auto md:h-full">
                    <div className="flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-0 flex items-center justify-center p-6 sm:p-8 md:p-10 relative bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden">
                        {loading ? (
                            <div className="w-64 aspect-[5/7] rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-t-geeko-cyan border-white/10 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center group/card">
                                <div className="absolute inset-0 bg-geeko-cyan/20 blur-[120px] rounded-full opacity-40 animate-pulse pointer-events-none" />
                                <img
                                    src={currentImage}
                                    alt={details?.name}
                                    className="max-w-[85%] max-h-[90%] md:max-w-full md:max-h-full object-contain drop-shadow-[0_45px_100px_rgba(0,0,0,0.95)] relative z-10 transition-transform duration-700 group-hover/card:scale-[1.03]"
                                    style={{
                                        imageRendering: 'auto',
                                        height: 'auto',
                                        width: 'auto',
                                    }}
                                />
                            </div>
                        )}
                        {hasMultipleFaces && !loading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentFaceIndex(prev => (prev + 1) % 2); }}
                                className="absolute bottom-6 right-6 p-3 md:p-4 bg-black/80 hover:bg-geeko-cyan text-white hover:text-black rounded-full border border-white/20 backdrop-blur-md transition-all z-30 group shadow-2xl"
                            >
                                <RotateCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        )}
                    </div>

                    {/* VERSIONS LIST */}
                    <div className="h-auto max-h-[180px] md:h-[240px] md:max-h-none border-t border-white/5 bg-[#080808] flex flex-col shrink-0">
                        <div className="px-6 py-3 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Edition / Printings</h3>
                            <span className="text-[10px] text-neutral-600 font-bold">{details?.all_versions?.length || 0} Versions</span>
                        </div>
                        <div className="flex-1 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden custom-scrollbar relative flex md:block whitespace-nowrap md:whitespace-normal p-2 md:p-0">
                            {loading ? (
                                // Versions Skeleton
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="inline-flex md:flex items-center gap-4 px-6 py-3 border-b border-white/5 animate-pulse">
                                        <div className="w-8 h-8 rounded bg-white/5" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-32 bg-white/5 rounded" />
                                            <div className="h-2 w-16 bg-white/5 rounded" />
                                        </div>
                                    </div>
                                ))
                            ) : details?.all_versions?.map((v) => (
                                <a
                                    key={v.printing_id}
                                    href={`/TCG/card/${v.printing_id}`}
                                    onClick={(e) => {
                                        if (!e.ctrlKey && !e.metaKey) {
                                            e.preventDefault();
                                            handleVersionClick(v.printing_id);
                                        }
                                    }}
                                    className={`inline-flex md:flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3 hover:bg-white/5 transition-colors border-r md:border-r-0 md:border-b border-white/5 group rounded-lg md:rounded-none ${activePrintingId === v.printing_id ? 'bg-geeko-cyan/10 border-geeko-cyan/20' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-black group-hover:text-geeko-cyan transition-colors shrink-0">
                                        {v.set_code.toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left min-w-[120px] md:min-w-0">
                                        <div className={`text-[10px] md:text-xs font-bold leading-tight truncate ${activePrintingId === v.printing_id ? 'text-geeko-cyan' : 'text-neutral-300'}`}>
                                            {v.set_name}
                                        </div>
                                        <div className="text-[9px] md:text-[10px] text-neutral-600 font-bold">#{v.collector_number} • {v.rarity}</div>
                                    </div>
                                    <div className="text-[10px] md:text-xs font-mono font-bold text-neutral-400 group-hover:text-white transition-colors">
                                        {v.price && v.price > 0 ? `$${v.price.toFixed(2)}` : '---'}
                                    </div>
                                </a>
                            ))}
                            <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none hidden md:block" />
                        </div>
                    </div>
                </div>

                {/* RIGHT: CARD TEXT & ACTIONS */}
                <div className="flex-1 h-auto md:h-full overflow-y-visible md:overflow-y-auto custom-scrollbar bg-[#050505] p-6 sm:p-8 md:p-10 space-y-6 md:space-y-8">
                    {loading ? (
                        <div className="space-y-12 animate-pulse">
                            <div className="space-y-4">
                                <div className="h-16 w-3/4 bg-white/5 rounded-2xl" />
                                <div className="h-6 w-1/2 bg-white/5 rounded-lg" />
                            </div>
                            <div className="h-48 w-full bg-white/5 rounded-[32px]" />
                            <div className="space-y-4">
                                <div className="h-4 w-32 bg-white/5 rounded" />
                                <div className="grid grid-cols-6 gap-3">
                                    {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl" />)}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="h-40 bg-white/5 rounded-[32px]" />
                                <div className="h-40 bg-white/5 rounded-[32px]" />
                            </div>
                        </div>
                    ) : details ? (
                        <>
                            <div className="space-y-4">
                                <a
                                    href={`/TCG/card/${details.card_id}`}
                                    className="block group/title"
                                    onClick={(e) => {
                                        if (!e.ctrlKey && !e.metaKey) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white text-gradient-cyan group-hover/title:brightness-125 transition-all text-balance leading-[0.9]">
                                        {details.name}
                                    </h2>
                                </a>
                                <div className="flex flex-wrap items-center gap-3 text-lg md:text-xl font-medium text-neutral-400">
                                    <span className="text-white/80">{details.mana_cost || ''}</span>
                                    {details.mana_cost && <span className="opacity-30">•</span>}
                                    <span className="italic">{details.type}</span>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/5 space-y-4 md:space-y-6">
                                <div className="text-base md:text-lg leading-relaxed text-neutral-300 font-medium whitespace-pre-wrap">
                                    {details.oracle_text}
                                </div>
                                {details.flavor_text && (
                                    <p className="text-sm italic text-neutral-500 font-serif border-t border-white/10 pt-6">
                                        "{details.flavor_text}"
                                    </p>
                                )}
                            </div>

                            <div className="space-y-10 pt-4">
                                {/* Format Legality - Full Width */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Format Legality</h3>
                                    <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                                        {relevantFormats.map(fmt => {
                                            const isLegal = details.legalities?.[fmt] === 'legal';
                                            return (
                                                <div
                                                    key={fmt}
                                                    className={`flex items-center justify-center p-3 md:p-4 rounded-xl border transition-all duration-300 ${isLegal
                                                        ? 'bg-geeko-green/10 border-geeko-green/40 text-geeko-green shadow-[0_0_20px_rgba(0,255,133,0.1)]'
                                                        : 'bg-neutral-900/40 border-white/5 text-neutral-600 opacity-60'
                                                        }`}
                                                >
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{fmt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Marketplace Actions - Side by Side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {/* Geekorium Price Box */}
                                    <div className="p-6 md:p-8 rounded-[32px] bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 group relative overflow-hidden flex flex-col justify-between gap-6">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-geeko-cyan/5 rounded-full blur-[40px]" />
                                        <div className="space-y-1 relative z-10">
                                            <div className="text-[10px] font-black uppercase text-geeko-cyan tracking-widest">Geekorium Price</div>
                                            <div className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                                                {details?.price && details.price > 0 ? `$${details.price.toFixed(2)}` : (details?.valuation?.market_price && details.valuation.market_price > 0 ? `$${details.valuation.market_price.toFixed(2)}` : '---')}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isAdding}
                                            className="w-full h-14 rounded-2xl bg-geeko-cyan text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shrink-0 relative z-10"
                                        >
                                            {isAdding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} fill="currentColor" />}
                                            {isAdding ? 'Adding...' : 'Add to Cart'}
                                        </button>
                                    </div>

                                    {/* External Market Box */}
                                    <a
                                        href={details.valuation?.market_url || `https://www.cardkingdom.com/mtg/search?filter[name]=${encodeURIComponent(details.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full h-full flex flex-col justify-between p-6 md:p-8 rounded-[32px] bg-neutral-900 hover:bg-geeko-cyan/10 border border-white/5 hover:border-geeko-cyan transition-all group relative overflow-hidden gap-6"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="space-y-1 relative z-10">
                                            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest group-hover:text-geeko-cyan transition-colors">External Market</span>
                                            <div className="text-lg font-bold leading-tight">Buy @ CardKingdom</div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 w-full relative z-10">
                                            <span className="text-2xl md:text-3xl font-mono font-black text-white group-hover:text-geeko-cyan transition-colors">
                                                {details.valuation?.market_price && details.valuation.market_price > 0 ? `$${details.valuation.market_price.toFixed(2)}` : 'Check Site'}
                                            </span>
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-geeko-cyan group-hover:text-black transition-all">
                                                <ExternalLink size={20} />
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
