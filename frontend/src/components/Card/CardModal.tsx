import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, ShoppingCart, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
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
        } else {
            setDetails(null);
            setActivePrintingId(null);
        }
    }, [isOpen, cardId]);

    const loadCardDetails = async (id: string) => {
        setLoading(true);
        setCurrentFaceIndex(0);

        try {
            let data = await fetchCardDetails(id);
            if (!data) throw new Error("No data found");

            // Resilience: Handle both flat and wrapped data formats
            if ((data as any).card) {
                data = (data as any).card;
            }

            // Mandatory: Always show the latest version (first in the list)
            if (data.all_versions && data.all_versions.length > 0) {
                const latestId = data.all_versions[0].printing_id;
                if (latestId !== id && !activePrintingId) {
                    // Stop current loading and fetch the latest instead
                    setActivePrintingId(latestId);
                    const latestData = await fetchCardDetails(latestId);
                    setDetails(latestData);
                    setLoading(false);
                    return;
                }
            }

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

    const getLegalityIcon = (status: string) => {
        if (status === 'legal') return <CheckCircle size={14} className="text-geeko-green" />;
        return <XCircle size={14} className="text-neutral-600" />;
    };

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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-4 animate-in fade-in zoom-in-95 duration-300"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-6xl h-full md:h-[90vh] glass-panel md:rounded-[32px] border-x-0 md:border border-white/10 shadow-[0_0_100px_rgba(0,163,255,0.15)] flex flex-col md:flex-row overflow-hidden">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400">
                    <X size={24} />
                </button>

                {/* LEFT: IMAGE & VERSIONS LIST */}
                <div className="w-full md:w-[450px] bg-[#0c0c0c] flex flex-col border-r border-white/5 overflow-hidden shrink-0">
                    <div className="flex-1 min-h-[400px] md:min-h-0 flex items-center justify-center p-6 md:p-8 relative overflow-hidden">
                        {loading ? (
                            <div className="w-64 h-90 rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-t-geeko-cyan border-white/10 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="relative group max-w-full">
                                <div className="absolute inset-0 bg-geeko-cyan/15 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <img
                                    src={currentImage}
                                    alt={details?.name}
                                    className="w-full max-w-[320px] md:max-w-sm rounded-[24px] shadow-[0_30px_70px_rgba(0,0,0,1)] z-10 transition-all duration-500 hover:scale-[1.02] border border-white/5"
                                />
                            </div>
                        )}
                        {hasMultipleFaces && !loading && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setCurrentFaceIndex(prev => (prev + 1) % 2); }}
                                className="absolute top-10 left-10 p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all z-20 group"
                            >
                                <RotateCw size={20} className="text-geeko-cyan group-hover:rotate-180 transition-transform duration-500" />
                            </button>
                        )}
                    </div>

                    {/* MOXFIELD-STYLE VERSIONS LIST */}
                    <div className="h-[250px] md:h-[300px] border-t border-white/5 bg-[#080808] flex flex-col shrink-0">
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Edition / Printings</h3>
                            <span className="text-[10px] text-neutral-600 font-bold">{details?.all_versions?.length || 0} Versions</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {details?.all_versions?.map((v) => (
                                <a
                                    key={v.printing_id}
                                    href={`/TCG/card/${v.printing_id}`}
                                    onClick={(e) => {
                                        if (!e.ctrlKey && !e.metaKey) {
                                            e.preventDefault();
                                            handleVersionClick(v.printing_id);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors border-b border-white/5 group ${activePrintingId === v.printing_id ? 'bg-geeko-cyan/10' : ''}`}
                                >
                                    <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-black group-hover:text-geeko-cyan transition-colors">
                                        {v.set_code.toUpperCase()}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={`text-xs font-bold leading-tight ${activePrintingId === v.printing_id ? 'text-geeko-cyan' : 'text-neutral-300'}`}>
                                            {v.set_name}
                                        </div>
                                        <div className="text-[10px] text-neutral-600 font-bold">#{v.collector_number} • {v.rarity}</div>
                                    </div>
                                    <div className="text-xs font-mono font-bold text-neutral-400 group-hover:text-white transition-colors">
                                        {v.price && v.price > 0 ? `$${v.price.toFixed(2)}` : '---'}
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CARD TEXT & ACTIONS */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-6 md:p-10 space-y-6 md:space-y-8">
                    {loading ? (
                        <div className="space-y-6">
                            <div className="h-10 w-3/4 bg-white/5 rounded-lg animate-pulse" />
                            <div className="h-32 w-full bg-white/5 rounded-lg animate-pulse" />
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
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white text-gradient-cyan group-hover/title:brightness-125 transition-all text-balance">
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
                                {/* Marketplace */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Marketplace</h3>

                                    <div className="p-8 rounded-3xl bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-geeko-cyan/5 rounded-full blur-[40px]" />
                                        <div className="text-[10px] font-black uppercase text-geeko-cyan tracking-widest mb-1">Geekorium Price</div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <span className="text-2xl md:text-3xl font-black text-white tracking-tighter">
                                                {details?.price && details.price > 0 ? `$${details.price.toFixed(2)}` : (details?.valuation?.market_price && details.valuation.market_price > 0 ? `$${details.valuation.market_price.toFixed(2)}` : '---')}
                                            </span>
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isAdding}
                                                className="w-full sm:w-auto h-12 md:h-14 px-8 rounded-2xl bg-geeko-cyan text-black font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                                            >
                                                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} fill="currentColor" />}
                                                {isAdding ? 'Adding...' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </div>

                                    <a
                                        href={details.valuation?.market_url || `https://www.cardkingdom.com/mtg/search?filter[name]=${encodeURIComponent(details.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-between p-5 rounded-2xl bg-neutral-900 hover:bg-geeko-cyan/10 border border-white/5 hover:border-geeko-cyan transition-all group mt-4"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest group-hover:text-geeko-cyan transition-colors">External Market</span>
                                            <span className="text-base md:text-lg font-bold">Buy @ CardKingdom</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg md:text-xl font-mono font-black text-white group-hover:text-geeko-cyan transition-colors">
                                                {details.valuation?.market_price && details.valuation.market_price > 0 ? `$${details.valuation.market_price.toFixed(2)}` : 'Check Site'}
                                            </span>
                                            <ExternalLink size={18} className="text-neutral-500 group-hover:text-geeko-cyan group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </a>
                                </div>

                                {/* Legality */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Format Legality</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {relevantFormats.map(fmt => (
                                            <div key={fmt} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/50 border border-white/5">
                                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{fmt}</span>
                                                {getLegalityIcon(details.legalities?.[fmt] || 'not_legal')}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
