import React, { useEffect, useState, useMemo } from 'react';
import { X, ShoppingCart, ExternalLink, RotateCw, Loader2 } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';
import { getCardKingdomUrl } from '../../utils/urlUtils';
import { ManaText } from '../Mana/ManaText';



interface CardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string | null;
    onAddToCartSuccess?: () => void;
    onRequireAuth?: () => void;
    isArchive?: boolean;
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

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, cardId, onAddToCartSuccess, isArchive }) => {
    const [details, setDetails] = useState<CardDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [activePrintingId, setActivePrintingId] = useState<string | null>(null);
    const [selectedFinish, setSelectedFinish] = useState<'nonfoil' | 'foil' | 'etched'>('nonfoil');

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
                if (isFoil) {
                    setSelectedFinish('foil');
                } else if (data.finish === 'etched') {
                    setSelectedFinish('etched');
                } else {
                    setSelectedFinish('nonfoil');
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

    const handleVersionClick = (id: string, finish?: string, e?: React.MouseEvent) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            return; // Allow native browser behavior for ctrl+click if it's a link
        }

        if (finish) setSelectedFinish(finish as any);

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




    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Removal of icon-based legality indicators in favor of color-coded boxes.

    const relevantFormats = ['standard', 'pioneer', 'modern', 'legacy', 'commander', 'pauper'];

    const versionGroups = useMemo(() => {
        if (!details?.all_versions) return [];

        const groups = (details.all_versions as Version[]).reduce((acc: any, v: Version) => {
            const key = `${v.set_code}-${v.collector_number}`;
            if (!acc[key]) {
                const isNormal = !(v.is_foil || v.finish === 'foil' || v.finish === 'etched');
                acc[key] = {
                    base: v, // will be normalized below
                    normal: isNormal ? v : null,
                    foil: (v.is_foil || v.finish === 'foil') ? v : null,
                    etched: v.finish === 'etched' ? v : null,
                };
            } else {
                if (!(v.is_foil || v.finish === 'foil' || v.finish === 'etched')) acc[key].normal = v;
                else if (v.finish === 'etched') acc[key].etched = v;
                else acc[key].foil = v;
            }
            return acc;
        }, {} as Record<string, any>);

        // Normalize: base should always be the normal version when available,
        // so activeGroup lookups by base.printing_id are consistent.
        Object.values(groups).forEach((g: any) => {
            g.base = g.normal || g.foil || g.etched || g.base;
        });

        return Object.values(groups).sort((a: any, b: any) =>
            a.base.set_name.localeCompare(b.base.set_name)
        );
    }, [details?.all_versions]);

    const activeGroup = useMemo<any>(() => {
        return versionGroups.find((g: any) =>
            g.normal?.printing_id === activePrintingId ||
            g.foil?.printing_id === activePrintingId ||
            g.etched?.printing_id === activePrintingId ||
            g.base?.printing_id === activePrintingId
        );
    }, [versionGroups, activePrintingId]);

    const activeVersion = useMemo(() => {
        if (!activeGroup) return null;
        if (selectedFinish === 'foil' && activeGroup.foil) return activeGroup.foil;
        if (selectedFinish === 'etched' && activeGroup.etched) return activeGroup.etched;
        return activeGroup.normal || activeGroup.base;
    }, [activeGroup, selectedFinish]);

    // Detect DFC from card name (e.g. "Aang, at the Crossroads // Aang, Destined Savior")
    const isDFC = details?.name?.includes(' // ');

    const currentImage = (() => {
        if (details?.card_faces && details.card_faces.length > 0) {
            const face = details.card_faces[currentFaceIndex];
            if (face?.image_uris) {
                return face.image_uris.normal || face.image_uris.large || face.image_uris.png;
            }
        }
        // DFC fallback: construct back face URL from Scryfall pattern
        if (isDFC && currentFaceIndex === 1 && details?.image_url) {
            return details.image_url.replace('/front/', '/back/');
        }
        return details?.image_url;
    })();

    const hasMultipleFaces = (details?.card_faces && details.card_faces.length > 1) || isDFC;

    const ckUrl = useMemo(() => {
        if (!details) return '#';
        const isFoil = activeVersion ? (activeVersion.is_foil || activeVersion.finish === 'foil') : !!(details.is_foil || details.finish === 'foil');
        return getCardKingdomUrl(details.name, isFoil);
    }, [details?.name, activeVersion]);

    const marketPrice = useMemo(() => {
        if (!activeVersion || !details) return details?.valuation?.market_price || 0;
        const isFoil = activeVersion.is_foil || activeVersion.finish === 'foil';
        const prices = (activeVersion as any).prices;
        if (prices) {
            return Number(isFoil ? (prices.usd_foil || prices.usd) : prices.usd) || details?.valuation?.market_price || 0;
        }
        return details?.valuation?.market_price || 0;
    }, [activeVersion, details]);

    if (!isOpen) return null;

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
                                <div className={`relative w-full h-full flex items-center justify-center drop-shadow-[0_45px_100px_rgba(0,0,0,0.95)] ${selectedFinish === 'foil' ? 'holo-effect' : ''}`}>
                                    {selectedFinish === 'foil' && (
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
                                    {versionGroups.map((group: any) => {
                                        const isGroupActive = activePrintingId === group.base.printing_id;
                                        const rowActiveVersion = (isGroupActive && selectedFinish === 'foil' && group.foil) ? group.foil : (group.normal || group.base);

                                        return (
                                            <div
                                                key={`${group.base.set_code}-${group.base.collector_number}`}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => {
                                                    const isCurrentlyFoil = !!(details?.is_foil || details?.finish === 'foil');
                                                    const targetPrintingId = isCurrentlyFoil
                                                        ? (group.foil?.printing_id || group.normal?.printing_id)
                                                        : (group.normal?.printing_id || group.foil?.printing_id);
                                                    if (targetPrintingId) handleVersionClick(targetPrintingId);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        const isCurrentlyFoil = !!(details?.is_foil || details?.finish === 'foil');
                                                        const targetPrintingId = isCurrentlyFoil
                                                            ? (group.foil?.printing_id || group.normal?.printing_id)
                                                            : (group.normal?.printing_id || group.foil?.printing_id);
                                                        if (targetPrintingId) handleVersionClick(targetPrintingId);
                                                    }
                                                }}
                                                data-testid="edition-link"
                                                className={`flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-white/10 transition-colors border-r md:border-r-0 md:border-b border-white/5 group rounded-lg md:rounded-none w-full text-left cursor-pointer outline-none focus-visible:bg-white/10 ${isGroupActive ? 'bg-geeko-cyan/10 border-geeko-cyan/20' : ''}`}
                                            >
                                                <div className="flex items-center gap-3 md:gap-4 flex-1">
                                                    <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-black group-hover:text-geeko-cyan transition-colors shrink-0">
                                                        {group.base.set_code.toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 text-left min-w-[120px] md:min-w-0">
                                                        <div className={`text-[10px] md:text-xs font-bold leading-tight truncate ${isGroupActive ? 'text-geeko-cyan' : 'text-neutral-300'}`}>
                                                            {group.base.set_name}
                                                        </div>
                                                        <div className="text-[9px] md:text-[10px] text-neutral-600 font-bold">#{group.base.collector_number} • {group.base.rarity}</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                                                    <div className="flex items-center gap-3 font-mono font-bold text-[10px] md:text-xs">
                                                        {group.normal && (
                                                            <span className={activePrintingId === group.normal.printing_id ? 'text-white' : 'text-neutral-500'}>
                                                                ${Number(group.normal.price).toFixed(2)}
                                                            </span>
                                                        )}
                                                        {group.normal && group.foil && <span className="text-neutral-700 mx-1">/</span>}
                                                        {group.foil && (
                                                            <span className={`flex items-center gap-1.5 ${activePrintingId === group.foil.printing_id ? 'text-purple-400' : 'text-neutral-600'}`}>
                                                                <span className="text-[10px]">✨</span>
                                                                ${Number(group.foil.price).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-[9px] font-black text-geeko-cyan uppercase tracking-tighter">
                                                            {rowActiveVersion?.stock || 0}
                                                        </div>
                                                        {!isArchive && (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    if (rowActiveVersion) handleVersionAddToCart(rowActiveVersion);
                                                                }}
                                                                className={`p-2 rounded-lg transition-all shrink-0 ${!rowActiveVersion?.stock || rowActiveVersion.stock === 0
                                                                    ? 'text-neutral-800 cursor-not-allowed'
                                                                    : 'text-neutral-500 hover:text-geeko-cyan hover:bg-geeko-cyan/10'
                                                                    }`}
                                                            >
                                                                <ShoppingCart size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none hidden md:block" />
                                </>
                            )
                            }
                        </div>
                    </div>
                </div>

                {/* RIGHT: CARD TEXT & ACTIONS */}
                <div className="flex-1 h-auto md:h-[var(--modal-height,700px)] overflow-y-auto custom-scrollbar bg-[#050505] p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
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

                                {/* Marketplace Actions - Optimized side-by-side layout */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                                    {/* Left Column: Local Inventory & Actions */}
                                    <div className="flex flex-col gap-3">
                                        {/* GK Price Box */}
                                        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 group relative overflow-hidden flex flex-col justify-between gap-4 flex-1">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-geeko-cyan/5 rounded-full blur-[40px]" />
                                            <div className="space-y-1 relative z-10">
                                                <div className="text-[10px] font-black uppercase text-geeko-cyan tracking-widest flex items-center justify-between">
                                                    <span>GK Price</span>
                                                    {marketPrice > 0 && details.price && details.price < marketPrice && (
                                                        <span className="text-[9px] text-geeko-green bg-geeko-green/10 px-2 py-0.5 rounded-full border border-geeko-green/20">
                                                            Ahorro: ${(marketPrice - details.price).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {/* Current Selected Price */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-3xl md:text-plus font-black text-white font-mono tracking-tighter">
                                                            ${(activeVersion?.price || details.price || 0) > 0 ? (activeVersion?.price || details.price).toFixed(2) : '---'}
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest shadow-sm ${selectedFinish === 'foil' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white animate-pulse' : 'bg-white text-black'}`}>
                                                            {selectedFinish.toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Finish Toggle Switch */}
                                                    <div className="flex bg-neutral-900/80 p-1 rounded-xl border border-white/5 w-fit mt-1">
                                                        <button
                                                            onClick={() => handleVersionClick(activePrintingId!, 'nonfoil')}
                                                            disabled={!activeGroup?.normal}
                                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selectedFinish === 'nonfoil'
                                                                ? 'bg-white text-black shadow-lg scale-[1.05]'
                                                                : activeGroup?.normal
                                                                    ? 'text-neutral-500 hover:text-white'
                                                                    : 'text-neutral-800 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Normal
                                                        </button>
                                                        <button
                                                            onClick={() => handleVersionClick(activePrintingId!, 'foil')}
                                                            disabled={!activeGroup?.foil}
                                                            className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${selectedFinish === 'foil'
                                                                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 border-transparent text-white shadow-lg'
                                                                : activeGroup?.foil
                                                                    ? 'text-neutral-500 hover:text-white'
                                                                    : 'text-neutral-800 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            Foil
                                                        </button>
                                                    </div>
                                                </div>

                                                {marketPrice > 0 && details.price && Math.abs(Number(details.price) - Number(marketPrice)) > 0.01 && (
                                                    <div className="text-sm font-bold text-neutral-600 line-through decoration-red-500/50">
                                                        MKT: ${Number(marketPrice).toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {!isArchive && (
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isAdding}
                                                data-testid="add-to-cart-button"
                                                className="w-full h-12 rounded-xl bg-geeko-cyan text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shrink-0 relative z-10"
                                            >
                                                {isAdding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} fill="currentColor" />}
                                                {isAdding ? 'Agregando...' : 'Agregar al Carrito'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Right Column: External Market */}
                                    <a
                                        href={ckUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col justify-between p-5 md:p-6 rounded-2xl bg-neutral-900 hover:bg-geeko-cyan/10 border border-white/5 hover:border-geeko-cyan transition-all group relative overflow-hidden gap-4"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="space-y-1 relative z-10">
                                            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest group-hover:text-geeko-cyan transition-colors">Mercado Externo</span>
                                            <div className="text-base md:text-lg font-bold leading-tight">Comprar @ CardKingdom</div>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 w-full relative z-10 mt-auto">
                                            <span className="text-xl md:text-3xl font-mono font-black text-white group-hover:text-geeko-cyan transition-colors">
                                                {marketPrice > 0 ? `$${Number(marketPrice).toFixed(2)}` : 'Ver en Sitio'}
                                            </span>
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-geeko-cyan group-hover:text-black transition-all">
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
        </div>
    );
};
