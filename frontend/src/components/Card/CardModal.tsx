import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';
import { ManaText } from '../Mana/ManaText';



interface CardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string | null;
    onAddToCartSuccess?: () => void;
    onRequireAuth?: () => void;
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
    stock?: number;
    finish?: string;
    is_foil?: boolean;
}

interface CardDetails {
    printing_id: string;
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
    finish?: string;
    is_foil?: boolean;
    valuation?: {
        store_price: number;
        market_price: number;
        market_url?: string;
        valuation_avg: number;
    };
    legalities: Record<string, string>;
    colors: string[];
    total_stock: number;
    card_faces?: CardFace[];
    all_versions?: Version[];
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, cardId, onAddToCartSuccess }) => {
    const [details, setDetails] = useState<CardDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [activePrintingId, setActivePrintingId] = useState<string | null>(null);

    // ... useEffect ...

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


    const [error, setError] = useState<string | null>(null);

    const loadCardDetails = async (id: string, skipAutoSwitch = false) => {
        console.log("CardModal: Start loading details for:", id);
        setLoading(true);
        setError(null);
        setCurrentFaceIndex(0);

        try {
            console.log("CardModal: Fetching details...");
            const data = await fetchCardDetails(id);
            console.log("CardModal: Data received:", data ? "yes" : "no");
            if (!data) throw new Error("No data found");

            // PRESERVE VERSIONS: If new data has no versions but old state had them for same oracle_id
            if ((!data.all_versions || data.all_versions.length <= 1) && details?.all_versions && details.all_versions.length > 1) {
                // If it's the same base card (oracle_id), keep the versions list
                const oldOracleId = details.card_id;
                const newOracleId = data.card_id || data.oracle_id;
                if (oldOracleId === newOracleId) {
                    data.all_versions = details.all_versions;
                }
            }

            // DEFAULT TO NORMAL: If we just loaded a foil version, but there is a normal version 
            // of this same card (same set + collector_num), switch to the normal one by default.
            // But ONLY if we haven't already skipped this (manual user clicks).
            if (!skipAutoSwitch) {
                const isFoil = !!(data.is_foil || data.finish === 'foil');
                if (isFoil && data.all_versions) {
                    const normalAlt = (data.all_versions as Version[]).find((v: Version) =>
                        v.set_code === data.set_code &&
                        v.collector_number === data.collector_number &&
                        !(v.is_foil || v.finish === 'foil')
                    );

                    if (normalAlt) {
                        console.log("CardModal: Auto-switching from Foil to Normal version as default");
                        loadCardDetails(normalAlt.printing_id, true);
                        return;
                    }
                }
            }

            setDetails(data);
            const pId = data.printing_id || data.card_id || id;
            setActivePrintingId(pId);
            console.log("CardModal: Details set with Printing ID:", pId);
        } catch (err: any) {
            console.error("CardModal: Failed to load details", err);
            setError(err.message || "Failed to load details");
        } finally {
            console.log("CardModal: Loading finished");
            setLoading(false);
        }
    };

    const handleVersionClick = (id: string, e?: React.MouseEvent) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            return; // Allow native browser behavior for ctrl+click if it's a link
        }
        if (id !== activePrintingId) {
            setActivePrintingId(id);
            loadCardDetails(id, true); // User explicitly clicked, don't auto-switch finishes anymore
        }
    };

    const handleAddToCart = async () => {
        if (!activePrintingId) return;

        setIsAdding(true);
        try {
            const result = await addToCart(activePrintingId, 1);
            if (result && !result.success) {
                // Show error message to user
                alert(result.message || result.error || 'No se pudo agregar al carrito');
                setIsAdding(false);
                return;
            }
            if (onAddToCartSuccess) {
                setTimeout(() => {
                    onClose();
                    onAddToCartSuccess();
                }, 500);
            }
        } catch (err: any) {
            console.error("Cart error", err);
            alert(err.message || 'Error al agregar al carrito');
        } finally {
            setTimeout(() => setIsAdding(false), 800);
        }
    };

    const handleVersionAddToCart = async (v: any) => {
        try {
            const result = await addToCart(v.printing_id, 1);
            if (result && !result.success) {
                // Show error message to user
                alert(result.message || result.error || 'No se pudo agregar al carrito');
                return;
            }
            if (onAddToCartSuccess) {
                onAddToCartSuccess();
            }
        } catch (err: any) {
            console.error("Cart error", err);
            alert(err.message || 'Error al agregar al carrito');
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
            {/* Modal Content */}
            <div
                data-testid="card-modal"
                className="glass-panel w-full max-w-6xl max-h-[90vh] rounded-[32px] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >    <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400">
                    <X size={24} />
                </button>

                {/* LEFT: IMAGE & VERSIONS LIST */}
                <div className="w-full md:w-[420px] lg:w-[480px] bg-[#0c0c0c] flex flex-col border-r border-white/5 overflow-hidden shrink-0 h-auto md:h-[var(--modal-height,700px)] min-h-[500px] md:min-h-0">
                    <div className="flex-1 min-h-[300px] md:min-h-0 relative flex items-center justify-center p-4 sm:p-6 md:p-10 bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden">
                        {loading ? (
                            <div className="w-64 aspect-[5/7] rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-t-geeko-cyan border-white/10 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center group/card">
                                <div className="absolute inset-0 bg-geeko-cyan/20 blur-[120px] rounded-full opacity-40 animate-pulse pointer-events-none" />
                                <div className={`relative w-full h-full flex items-center justify-center drop-shadow-[0_45px_100px_rgba(0,0,0,0.95)] ${(details?.is_foil || details?.finish === 'foil') ? 'holo-effect' : ''}`}>
                                    {(details?.is_foil || details?.finish === 'foil') && (
                                        <div className="absolute inset-0 z-20 foil-shimmer opacity-30 mix-blend-overlay pointer-events-none rounded-[10%] scale-[0.95]" />
                                    )}
                                    <img
                                        src={currentImage}
                                        alt={details?.name}
                                        className="max-w-[90%] max-h-[95%] md:max-w-full md:max-h-full object-contain relative z-10 transition-transform duration-700 group-hover/card:scale-[1.03]"
                                        style={{
                                            imageRendering: 'auto',
                                            height: 'auto',
                                            width: 'auto',
                                        }}
                                    />
                                </div>
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
                    <div className="h-auto md:flex-[0_0_35%] md:min-h-[200px] border-t border-white/5 bg-[#080808] flex flex-col shrink-0">
                        <div className="px-6 py-3 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/50">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Edición / Impresiones</h3>
                            <span className="text-[10px] text-neutral-600 font-bold">{details?.all_versions?.length || 0} Versiones</span>
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
                            ) : (
                                <>
                                    {details?.all_versions?.map((v: Version) => (
                                        <a
                                            key={v.printing_id}
                                            href={`card/${v.printing_id}`}
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
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center justify-end gap-1 text-[10px] md:text-xs font-mono font-bold text-neutral-400 group-hover:text-white transition-colors">
                                                    {v.price && v.price > 0 ? `$${v.price.toFixed(2)}` : 'S/P'}
                                                    {(v.is_foil || v.finish === 'foil') && (
                                                        <span className="text-[8px] bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white px-1 py-0.5 rounded uppercase font-black" title="Foil">
                                                            FOIL
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[8px] font-black text-geeko-cyan uppercase tracking-tighter">
                                                    {v.stock || 0} en Stock
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleVersionAddToCart(v);
                                                }}
                                                disabled={!v.stock || v.stock === 0}
                                                aria-label={`Add ${v.set_name} version to cart`}
                                                className={`p-1.5 md:p-2 rounded-lg transition-all shrink-0 ${!v.stock || v.stock === 0
                                                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                                                    : 'bg-white/5 hover:bg-geeko-cyan text-neutral-400 hover:text-black opacity-0 group-hover:opacity-100'
                                                    }`}
                                            >
                                                <ShoppingCart size={14} />
                                            </button>
                                        </a>
                                    ))}
                                    <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none hidden md:block" />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: CARD TEXT & ACTIONS */}
                <div className="flex-1 h-auto md:h-[var(--modal-height,700px)] overflow-y-visible md:overflow-y-auto custom-scrollbar bg-[#050505] p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
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
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 animate-in fade-in">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Error Loading Card</h3>
                            <p className="text-sm text-neutral-400 font-medium max-max-w-xs mx-auto">{error}</p>
                            <button
                                onClick={() => activePrintingId && loadCardDetails(activePrintingId)}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-white/20 mt-4"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : details ? (
                        <>
                            <div className="space-y-2">
                                <a
                                    href={`/card/${details.card_id}`}
                                    className="block group/title"
                                    onClick={(e) => {
                                        if (!e.ctrlKey && !e.metaKey) {
                                            e.preventDefault();
                                        }
                                    }}
                                >
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white text-gradient-cyan group-hover/title:brightness-125 transition-all leading-tight">
                                        {details.name}
                                    </h2>
                                </a>
                                <div className="flex flex-wrap items-center gap-2 text-sm md:text-base font-semibold text-neutral-400">
                                    <span className="text-white/80"><ManaText text={details.mana_cost || ''} /></span>
                                    {details.mana_cost && <span className="opacity-30">•</span>}
                                    <span className="italic">{details.type}</span>
                                </div>
                            </div>

                            <div className="p-4 md:p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                <div className="text-sm md:text-base leading-relaxed text-neutral-300 whitespace-pre-wrap">
                                    <ManaText text={details.oracle_text} />
                                </div>
                                {details.flavor_text && (
                                    <p className="text-xs italic text-neutral-500 font-serif border-t border-white/10 pt-3">
                                        "{details.flavor_text}"
                                    </p>
                                )}
                            </div>

                            <div className="space-y-6 pt-2">
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500 flex items-center justify-between">
                                        Legalidad de Formato
                                        {details.total_stock > 0 && (
                                            <span className="text-[10px] text-geeko-cyan bg-geeko-cyan/10 px-3 py-1 rounded-full border border-geeko-cyan/20">
                                                Existencia Total: {details.total_stock}
                                            </span>
                                        )}
                                    </h3>
                                    <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-6 gap-2">
                                        {relevantFormats.map(fmt => {
                                            const isLegal = details.legalities?.[fmt] === 'legal';
                                            return (
                                                <div
                                                    key={fmt}
                                                    className={`flex items-center justify-center p-2.5 rounded-lg border transition-all duration-300 ${isLegal
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    {/* GK Price Box */}
                                    <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 group relative overflow-hidden flex flex-col justify-between gap-4">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-geeko-cyan/5 rounded-full blur-[40px]" />
                                        <div className="space-y-1 relative z-10">
                                            <div className="text-[10px] font-black uppercase text-geeko-cyan tracking-widest flex items-center justify-between">
                                                <span>GK Price</span>
                                                {details?.valuation?.market_price && details.price && details.price < details.valuation.market_price && (
                                                    <span className="text-[9px] text-geeko-green bg-geeko-green/10 px-2 py-0.5 rounded-full border border-geeko-green/20">
                                                        Ahorro: ${(details.valuation.market_price - details.price).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                                                    {/* Current Selected Price */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none">
                                                            {(details?.price && details.price > 0) ? `$${details.price.toFixed(2)}` : (details?.valuation?.market_price && details.valuation.market_price > 0 ? `$${details.valuation.market_price.toFixed(2)}` : 'S/P')}
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest shadow-sm ${(details?.is_foil || details?.finish === 'foil') ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white animate-pulse' : 'bg-white text-black'}`}>
                                                            {(details?.is_foil || details?.finish === 'foil') ? 'FOIL' : 'NORMAL'}
                                                        </span>
                                                    </div>

                                                    {/* Alternate Finish Price (Clickable) */}
                                                    {(() => {
                                                        const currentIsFoil = !!(details?.is_foil || details?.finish === 'foil');
                                                        const otherFinish = details?.all_versions?.find(v =>
                                                            v.set_code === details.set_code &&
                                                            v.collector_number === details.collector_number &&
                                                            v.printing_id !== details.printing_id &&
                                                            (!!(v.is_foil || v.finish === 'foil') !== currentIsFoil) && // This ensures we find the OPPOSITE finish
                                                            v.price > 0
                                                        );

                                                        if (otherFinish) {
                                                            const isFoil = otherFinish.is_foil || otherFinish.finish === 'foil';
                                                            return (
                                                                <button
                                                                    onClick={() => handleVersionClick(otherFinish.printing_id)}
                                                                    className="flex items-center gap-2 group/slash py-1 px-2 rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                                                                >
                                                                    <span className="text-xl md:text-2xl text-neutral-500 font-medium">/</span>
                                                                    <span className="text-xl md:text-2xl text-neutral-400 font-bold group-hover/slash:text-geeko-cyan transition-colors">
                                                                        ${otherFinish.price.toFixed(2)}
                                                                    </span>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-tighter ${isFoil ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-neutral-400 group-hover/slash:text-white group-hover/slash:from-pink-500 group-hover/slash:via-purple-500 group-hover/slash:to-cyan-500' : 'bg-neutral-800 text-neutral-500 group-hover/slash:bg-white group-hover/slash:text-black'}`}>
                                                                        {isFoil ? 'FOIL' : 'NORMAL'}
                                                                    </span>
                                                                </button>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>

                                                {details?.valuation?.market_price && details.price && Math.abs(details.price - details.valuation.market_price) > 0.01 && (
                                                    <div className="text-sm font-bold text-neutral-600 line-through decoration-red-500/50">
                                                        MKT: ${details.valuation.market_price.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isAdding}
                                            data-testid="add-to-cart-button"
                                            className="w-full h-12 rounded-xl bg-geeko-cyan text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shrink-0 relative z-10"
                                        >
                                            {isAdding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} fill="currentColor" />}
                                            {isAdding ? 'Agregando...' : 'Agregar al Carrito'}
                                        </button>
                                    </div>

                                    {/* External Market Box */}
                                    <a
                                        href={details.valuation?.market_url || `https://www.cardkingdom.com/mtg/search?filter[name]=${encodeURIComponent(details.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full h-full flex flex-col justify-between p-4 md:p-5 rounded-2xl bg-neutral-900 hover:bg-geeko-cyan/10 border border-white/5 hover:border-geeko-cyan transition-all group relative overflow-hidden gap-4"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="space-y-1 relative z-10">
                                            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest group-hover:text-geeko-cyan transition-colors">Mercado Externo</span>
                                            <div className="text-base font-bold leading-tight">Comprar @ CardKingdom</div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 w-full relative z-10">
                                            <span className="text-xl md:text-2xl font-mono font-black text-white group-hover:text-geeko-cyan transition-colors">
                                                {details.valuation?.market_price && details.valuation.market_price > 0 ? `$${details.valuation.market_price.toFixed(2)}` : 'Ver en Sitio'}
                                            </span>
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-geeko-cyan group-hover:text-black transition-all">
                                                <ExternalLink size={18} />
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div >
    );
};
