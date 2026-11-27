import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart, RotateCw, Loader2, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { CardImage } from './CardImage';
import { normalizeGameCode, getTcgConfig } from '../../config/tcgRegistry';

const MTG_LEGALITY_FORMATS: { key: string; label: string }[] = [
    { key: 'standard', label: 'STANDARD' },
    { key: 'modern', label: 'MODERN' },
    { key: 'pioneer', label: 'PIONEER' },
    { key: 'pauper', label: 'PAUPER' },
    { key: 'duel', label: 'DUEL - CMD' },
    { key: 'commander', label: 'COMMANDER' },
];

export interface CardDetailBlocksProps {
    details: any;
    loading: boolean;
    error: string | null;
    onRetry?: () => void;
    onClose: () => void;
    activePrintingId: string | null | undefined;
    selectedFinish: 'nonfoil' | 'foil' | 'etched';
    activeGroup: any;
    activeVersion: any;
    versionGroups: any[];
    currentImage: string;
    allImages?: string[];
    hasMultipleFaces: boolean;
    onFlipFace: () => void;
    onSelectVersion: (printingId: string, finish?: 'nonfoil' | 'foil' | 'etched') => void;
    onAddToCart: (quantity: number) => void;
    isAdding: boolean;
    addedSuccess: boolean;
    isArchive?: boolean;
    isDetailsLoaded?: boolean;
    showDesktopClose?: boolean;
    hasMobileHeader?: boolean;
}

const VersionMiniature: React.FC<{ imageUrl?: string; setCode?: string; alt: string }> = ({
    imageUrl,
    setCode,
    alt,
}) => {
    const [imgFailed, setImgFailed] = useState(false);

    if (!imageUrl || imgFailed) {
        return (
            <div className="w-9 h-12 rounded-md bg-neutral-900 border border-white/15 flex items-center justify-center text-[10px] font-black uppercase text-neutral-300 shrink-0">
                {(setCode || '??').toUpperCase()}
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-9 h-12 rounded-md object-cover border border-white/15 bg-neutral-900 shrink-0 shadow-sm"
        />
    );
};

export const CardDetailBlocks: React.FC<CardDetailBlocksProps> = ({
    details,
    loading,
    error,
    onRetry,
    onClose,
    activePrintingId,
    selectedFinish,
    activeGroup,
    activeVersion,
    versionGroups,
    currentImage,
    allImages = [],
    hasMultipleFaces,
    onFlipFace,
    onSelectVersion,
    onAddToCart,
    isAdding,
    addedSuccess,
    isArchive = false,
    isDetailsLoaded = true,
    showDesktopClose = true,
    hasMobileHeader = false,
}) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [carouselIdx, setCarouselIdx] = useState<number>(0);

    // Reset quantity when user switches card, printing, or finish
    useEffect(() => {
        setQuantity(1);
    }, [activePrintingId, selectedFinish, details?.card_id]);

    useEffect(() => {
        setCarouselIdx(0);
    }, [currentImage, details?.printing_id]);

    const normalizedGame = useMemo(() => normalizeGameCode(details?.game), [details?.game]);
    const tcgConfig = useMemo(() => getTcgConfig(details?.game), [details?.game]);

    const displayImage = useMemo(() => {
        if (!hasMultipleFaces && allImages.length > 1) {
            return allImages[carouselIdx] || currentImage;
        }
        return activeVersion?.image_url || currentImage;
    }, [hasMultipleFaces, allImages, carouselIdx, activeVersion?.image_url, currentImage]);

    const currentStock = Number(activeVersion?.stock ?? details?.stock ?? 0);
    const maxQty = currentStock > 0 ? currentStock : 99;
    const effectivePrice = Number(activeVersion?.price ?? details?.price ?? 0);
    const originalPrice = Number(activeVersion?.original_price ?? details?.original_price ?? effectivePrice);
    const discountPct = Number(activeVersion?.discount_percentage ?? details?.discount_percentage ?? 0);

    const activeEditionName = activeVersion?.set_name || details?.set || '';
    const activeSetCode = (activeVersion?.set_code || details?.set_code || '').toUpperCase();
    const activeCollectorNum = activeVersion?.collector_number || details?.collector_number || '';

    const isFoilVisual = selectedFinish === 'foil' || selectedFinish === 'etched';

    // Legality formats to display: MTG has strictly the 6 required formats
    const legalityItems = useMemo(() => {
        if (normalizedGame === 'MTG') {
            return MTG_LEGALITY_FORMATS;
        }
        if (tcgConfig?.formats && tcgConfig.formats.length > 0) {
            return tcgConfig.formats.map((f) => ({
                key: f,
                label: f.replace(/_/g, ' ').toUpperCase(),
            }));
        }
        return [];
    }, [normalizedGame, tcgConfig]);

    const handleQtyChange = (next: number) => {
        if (isNaN(next) || next < 1) {
            setQuantity(1);
            return;
        }
        setQuantity(Math.min(maxQty, Math.floor(next)));
    };

    if (details?.is_accessory) {
        return (
            <div className="flex flex-col md:flex-row w-full h-full relative">
                {showDesktopClose && (
                    <button
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="absolute top-4 right-5 z-50 w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/60 text-red-400 hover:text-red-300 hidden md:flex items-center justify-center transition-all"
                    >
                        <X size={16} />
                    </button>
                )}

                <div className="w-full md:w-[380px] bg-[#0c0e13] flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10 shrink-0 min-h-[280px]">
                    <CardImage
                        src={displayImage}
                        alt={details?.name || 'Accesorio'}
                        size="normal"
                        objectFit="contain"
                        fallbackIconSize={60}
                        className="max-w-[280px] max-h-[280px] object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
                    />
                </div>

                <div className="flex-1 bg-[#090b10] p-6 md:p-8 flex flex-col justify-between gap-5 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-geeko-cyan">
                            {details.set || 'Accesorio'}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tight text-white leading-tight capitalize">
                            {details.name}
                        </h2>
                    </div>

                    {details.oracle_text && (
                        <p className="text-sm text-neutral-300 leading-relaxed bg-white/[0.03] border border-white/10 rounded-xl p-4">
                            {details.oracle_text}
                        </p>
                    )}

                    <div className="p-4 rounded-2xl bg-[#072e30] border border-teal-400/25 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <div className="text-3xl font-black text-white font-mono">
                                {effectivePrice > 0 ? `${effectivePrice.toFixed(2)} $` : 'S/P'}
                            </div>
                            <div className="text-xs font-black text-emerald-400 mt-1">
                                DISP: {details.total_stock ?? 0}
                            </div>
                        </div>
                        {!isArchive && (
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.max(1, Number(details.total_stock || 99))}
                                    value={quantity}
                                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                                    aria-label="Cantidad"
                                    className="w-16 h-11 rounded-xl bg-white text-black font-black text-center text-base outline-none"
                                />
                                <button
                                    onClick={() => onAddToCart(quantity)}
                                    disabled={isAdding}
                                    data-testid="add-to-cart-button"
                                    className="px-5 h-11 rounded-xl bg-geeko-cyan text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                                >
                                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : addedSuccess ? '¡Añadido! ✓' : <ShoppingCart size={16} />}
                                    {!isAdding && !addedSuccess && 'Agregar'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[360px] text-center p-8 space-y-4">
                <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Error al cargar carta</h3>
                <p className="text-sm text-neutral-400 max-w-xs">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        );
    }

    if (loading && !details) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full min-h-[420px] space-y-4">
                <Loader2 size={36} className="text-geeko-cyan animate-spin" />
                <p className="text-sm font-black text-geeko-cyan uppercase tracking-widest animate-pulse">
                    Cargando Información...
                </p>
            </div>
        );
    }

    if (!details) return null;

    return (
        <div className="w-full h-auto md:h-full grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-white/5 relative bg-[#090c11]">
            {/* Top-Right Close Button (matching mockup red outline X on desktop) */}
            {showDesktopClose && (
                <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute top-4 right-4 z-50 w-9 h-9 rounded-lg bg-black/70 hover:bg-red-500/20 border border-red-500/60 text-red-400 hover:text-red-300 hidden md:flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
                >
                    <X size={16} strokeWidth={2.5} />
                </button>
            )}

            {/* ════════════════════════════════════════════════════════════════
                BLOQUE 1 (IZQUIERDA DESKTOP / ARRIBA MOBILE): IMAGEN DE LA CARTA
               ════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col items-center justify-center px-4 pt-3 pb-2 md:p-5 bg-[#0a0d13] relative">
                {loading && !displayImage ? (
                    <div className="w-full max-w-[290px] sm:max-w-[310px] md:max-w-[295px] aspect-[5/7] rounded-2xl bg-white/5 border border-white/10 animate-pulse flex flex-col items-center justify-center gap-2">
                        <Loader2 size={28} className="text-geeko-cyan animate-spin" />
                        <span className="text-[10px] font-black text-geeko-cyan uppercase tracking-widest">Cargando...</span>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[290px] sm:max-w-[310px] md:max-w-[295px] aspect-[5/7] flex items-center justify-center group/card">
                        <div className={`relative w-full h-full rounded-xl overflow-hidden border transition-all ${isFoilVisual ? 'border-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.35)] holo-effect' : 'border-white/15 shadow-[0_20px_55px_rgba(0,0,0,0.9)]'}`}>
                            {isFoilVisual && (
                                <div className="absolute inset-0 z-20 foil-shimmer opacity-30 mix-blend-overlay pointer-events-none" />
                            )}
                            <CardImage
                                src={displayImage}
                                alt={details?.name || 'Card Image'}
                                size="normal"
                                objectFit="contain"
                                fallbackIconSize={72}
                                className="w-full h-full object-contain rounded-xl relative z-10 transition-transform duration-500 group-hover/card:scale-[1.02]"
                            />
                        </div>

                        {hasMultipleFaces && !loading && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFlipFace();
                                }}
                                aria-label="Voltear carta"
                                className="absolute bottom-3 right-3 p-2.5 bg-black/80 hover:bg-geeko-cyan text-white hover:text-black rounded-full border border-white/20 backdrop-blur-md transition-all z-30 shadow-xl"
                            >
                                <RotateCw size={16} />
                            </button>
                        )}

                        {!hasMultipleFaces && allImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCarouselIdx((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                                    }}
                                    className="absolute top-1/2 left-2 -translate-y-1/2 z-30 p-1.5 bg-black/70 hover:bg-geeko-cyan text-white hover:text-black rounded-full border border-white/15"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCarouselIdx((prev) => (prev + 1) % allImages.length);
                                    }}
                                    className="absolute top-1/2 right-2 -translate-y-1/2 z-30 p-1.5 bg-black/70 hover:bg-geeko-cyan text-white hover:text-black rounded-full border border-white/15"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════════════
                BLOQUE 2 (CENTRO DESKTOP / MEDIO MOBILE): INFO, LEGALIDAD Y COMPRA
               ════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col justify-center px-4 py-3 md:p-5 bg-[#090c11] gap-3.5 md:overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                    {/* TCG Header (hidden on mobile when parent modal provides a sticky mobile TCG header) */}
                    <div className={`${hasMobileHeader ? 'hidden md:flex' : 'flex'} items-center gap-2`}>
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                                src={`/logos/tcg/${normalizedGame || 'MTG'}.png`}
                                alt={normalizedGame || 'TCG'}
                                className="w-3 h-3 object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-neutral-200">
                            {tcgConfig?.gameName || normalizedGame || 'MAGIC: THE GATHERING'}
                        </span>
                    </div>

                    {/* Card Name */}
                    <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-white leading-tight break-words">
                        {details.name?.replace(/\(preventa\)/gi, '').trim()}
                    </h2>

                    {/* Edition Name + Collector Number Code */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-300 leading-snug">
                        {activeEditionName && <span>{activeEditionName}</span>}
                        {(activeSetCode || activeCollectorNum) && (
                            <span className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-geeko-cyan font-mono font-bold text-[10px] whitespace-nowrap">
                                {activeSetCode ? `${activeSetCode} ` : ''}{activeCollectorNum ? `#${activeCollectorNum}` : ''}
                            </span>
                        )}
                    </div>

                    {loading && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-geeko-cyan/15 border border-geeko-cyan/35 text-geeko-cyan animate-pulse">
                            <Loader2 size={12} className="animate-spin shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Cargando Información...</span>
                        </div>
                    )}

                    {/* Legality Formats */}
                    {legalityItems.length > 0 && (
                        <div className="pt-2 space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white">
                                Legalidad de Formato
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {legalityItems.map((fmt) => {
                                    const rawStatus = details?.legalities?.[fmt.key];
                                    const isLegal = rawStatus === 'legal' || rawStatus === 'restricted';
                                    return (
                                        <div
                                            key={fmt.key}
                                            data-testid={`legality-${fmt.key}`}
                                            data-legal={isLegal ? 'true' : 'false'}
                                            className={`px-2 py-1.5 rounded-lg border text-center text-[10px] font-bold uppercase tracking-wider transition-colors truncate ${
                                                isLegal
                                                    ? 'border-emerald-500/80 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.12)]'
                                                    : 'border-white/15 text-neutral-500 bg-transparent opacity-60'
                                            }`}
                                            title={`${fmt.label}: ${isLegal ? 'Legal' : 'No legal'}`}
                                        >
                                            {fmt.label}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Purchase Card Box */}
                <div className="rounded-2xl bg-[#072e30] border border-teal-400/20 p-3.5 md:p-4 flex flex-col gap-3 shadow-lg">
                    {/* Top Row: Finish Tabs (Normal / Foil) + Quantity Input */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Finish tabs with prices */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {activeGroup?.normal && (
                                <button
                                    type="button"
                                    onClick={() => onSelectVersion(activeGroup.normal.printing_id, 'nonfoil')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                        selectedFinish === 'nonfoil'
                                            ? 'bg-white text-black shadow-md'
                                            : 'bg-black/45 text-neutral-300 hover:text-white border border-white/10'
                                    }`}
                                >
                                    <span>NORMAL</span>
                                    <span className={`font-mono text-[10px] ${selectedFinish === 'nonfoil' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                                        {Number(activeGroup.normal.price || 0).toFixed(2)}$
                                    </span>
                                </button>
                            )}
                            {activeGroup?.foil && (
                                <button
                                    type="button"
                                    onClick={() => onSelectVersion(activeGroup.foil.printing_id, 'foil')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                        selectedFinish === 'foil'
                                            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-md'
                                            : 'bg-black/45 text-neutral-300 hover:text-white border border-white/10'
                                    }`}
                                >
                                    <span>FOIL</span>
                                    <span className={`font-mono text-[10px] ${selectedFinish === 'foil' ? 'text-white/90' : 'text-neutral-400'}`}>
                                        {Number(activeGroup.foil.price || 0).toFixed(2)}$
                                    </span>
                                </button>
                            )}
                            {activeGroup?.etched && (
                                <button
                                    type="button"
                                    onClick={() => onSelectVersion(activeGroup.etched.printing_id, 'etched')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                        selectedFinish === 'etched'
                                            ? 'bg-amber-500 text-black shadow-md'
                                            : 'bg-black/45 text-neutral-300 hover:text-white border border-white/10'
                                    }`}
                                >
                                    <span>ETCHED</span>
                                    <span className="font-mono text-[10px]">
                                        {Number(activeGroup.etched.price || 0).toFixed(2)}$
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Quantity Control */}
                        {!isArchive && (
                            <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-sm shrink-0">
                                <button
                                    type="button"
                                    aria-label="Disminuir cantidad"
                                    onClick={() => handleQtyChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                    className="px-2 py-2 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                                >
                                    <Minus size={12} strokeWidth={3} />
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={maxQty}
                                    value={quantity}
                                    onChange={(e) => handleQtyChange(Number(e.target.value))}
                                    aria-label="Cantidad"
                                    className="w-10 text-center text-black font-black text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                    type="button"
                                    aria-label="Aumentar cantidad"
                                    onClick={() => handleQtyChange(quantity + 1)}
                                    disabled={quantity >= maxQty}
                                    className="px-2 py-2 text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                                >
                                    <Plus size={12} strokeWidth={3} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom Row: Price (+ Discount) on Left, Add Button + Version Stock on Right */}
                    <div className="flex items-end justify-between gap-3 pt-1">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight leading-none">
                                {effectivePrice > 0 ? `${effectivePrice.toFixed(2)} $` : 'S/P'}
                            </div>
                            {discountPct > 0 && (
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                    <span className="text-xs font-bold text-neutral-300 line-through">
                                        {originalPrice.toFixed(2)}$
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                                        {discountPct}% OFF
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {!isArchive && (
                                <button
                                    type="button"
                                    onClick={() => onAddToCart(quantity)}
                                    disabled={isAdding}
                                    data-testid="add-to-cart-button"
                                    className={`px-4 h-11 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg ${
                                        addedSuccess
                                            ? 'bg-emerald-400 text-black'
                                            : 'bg-geeko-cyan text-black hover:brightness-110'
                                    }`}
                                >
                                    {isAdding ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : addedSuccess ? (
                                        <span>¡Añadido! ✓</span>
                                    ) : (
                                        <>
                                            <Plus size={14} strokeWidth={3} />
                                            <ShoppingCart size={16} fill="currentColor" />
                                        </>
                                    )}
                                </button>
                            )}
                            <span
                                className={`text-xs font-black uppercase tracking-wider ${
                                    currentStock > 0 ? 'text-emerald-400' : 'text-orange-400'
                                }`}
                            >
                                {currentStock > 0 ? `DISP: ${currentStock}` : 'Por Encargo'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                BLOQUE 3 (DERECHA DESKTOP / ABAJO MOBILE): EDICIONES DISPONIBLES
               ════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col bg-[#080b10] px-4 pt-3 pb-5 md:p-5 md:pr-4 border-t border-white/10 md:border-t-0 md:min-h-0 md:max-h-[470px] md:overflow-hidden">
                <div className="pb-2.5 border-b border-white/10 md:pr-11 shrink-0">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-white">
                        Ediciones disponibles en Geekorium
                    </h3>
                    <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-xs font-black uppercase text-emerald-400 tracking-wide">
                            TOTAL DISP: {details.total_stock ?? 0}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                            {versionGroups.length} {versionGroups.length === 1 ? 'Versión' : 'Versiones'}
                        </span>
                    </div>
                </div>

                <div
                    data-testid="versions-list-container"
                    className="md:flex-1 md:overflow-y-auto custom-scrollbar mt-2.5 space-y-2 md:pr-1"
                >
                    {loading || !isDetailsLoaded ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] animate-pulse">
                                <div className="w-9 h-12 rounded bg-white/10 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-3/4 bg-white/10 rounded" />
                                    <div className="h-2.5 w-1/2 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))
                    ) : versionGroups.length > 0 ? (
                        versionGroups.map((group: any) => {
                            const isGroupActive =
                                activePrintingId === group.base?.printing_id ||
                                activePrintingId === group.normal?.printing_id ||
                                activePrintingId === group.foil?.printing_id ||
                                activePrintingId === group.etched?.printing_id;
                            const setCode = (group.base?.set_code || '').toUpperCase();
                            const setCodeLower = (group.base?.set_code || '').toLowerCase();
                            const thumbUrl = group.base?.image_url || currentImage;

                            return (
                                <div
                                    key={`${group.base?.set_code}-${group.base?.collector_number}-${group.base?.printing_id}`}
                                    data-testid="edition-link"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        const preferred =
                                            selectedFinish === 'foil'
                                                ? group.foil || group.normal || group.etched
                                                : selectedFinish === 'etched'
                                                  ? group.etched || group.normal || group.foil
                                                  : group.normal || group.foil || group.etched;
                                        if (preferred?.printing_id) {
                                            const pFinish = (preferred.finish || (preferred.is_foil ? 'foil' : 'nonfoil')) as
                                                | 'nonfoil'
                                                | 'foil'
                                                | 'etched';
                                            onSelectVersion(preferred.printing_id, pFinish);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            const preferred = group.normal || group.foil || group.etched || group.base;
                                            if (preferred?.printing_id) {
                                                const pFinish = (preferred.finish || (preferred.is_foil ? 'foil' : 'nonfoil')) as
                                                    | 'nonfoil'
                                                    | 'foil'
                                                    | 'etched';
                                                onSelectVersion(preferred.printing_id, pFinish);
                                            }
                                        }
                                    }}
                                    className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isGroupActive
                                            ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                                            : 'border-white/10 bg-[#0d141d] hover:border-white/25 hover:bg-[#121c29]'
                                    }`}
                                >
                                    {/* Left: Super miniatura + Edition Metadata */}
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                        <VersionMiniature
                                            imageUrl={thumbUrl}
                                            setCode={setCode}
                                            alt={`${details.name} (${setCode})`}
                                        />

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className={`text-xs font-bold leading-tight truncate ${isGroupActive ? 'text-white' : 'text-neutral-200'}`}>
                                                {group.base?.set_name || setCode}
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                                                {setCode && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-neutral-300">
                                                        {normalizedGame === 'MTG' && setCodeLower && (
                                                            <img
                                                                src={`https://svgs.scryfall.io/sets/${setCodeLower}.svg`}
                                                                alt=""
                                                                className="w-2.5 h-2.5 invert opacity-80"
                                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                            />
                                                        )}
                                                        {setCode}
                                                    </span>
                                                )}
                                                {group.base?.collector_number && (
                                                    <span className="text-neutral-400 font-mono">
                                                        #{group.base.collector_number}
                                                    </span>
                                                )}
                                                <span className="text-emerald-400 font-black">
                                                    DISP: {group.totalStock}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Normal & Foil separated vertically with finish stock & price */}
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        {group.normal && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectVersion(group.normal.printing_id, 'nonfoil');
                                                }}
                                                className={`flex flex-col items-end px-2 py-0.5 rounded-lg transition-colors ${
                                                    isGroupActive && selectedFinish === 'nonfoil'
                                                        ? 'bg-white/15 ring-1 ring-white/40'
                                                        : 'hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-300">
                                                    NORMAL {group.foil ? `(${group.normal.stock || 0})` : ''}
                                                </span>
                                                <span className="text-xs font-black font-mono text-white leading-tight">
                                                    {Number(group.normal.price || 0).toFixed(2)} $
                                                </span>
                                            </button>
                                        )}
                                        {group.foil && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectVersion(group.foil.printing_id, 'foil');
                                                }}
                                                className={`flex flex-col items-end px-2 py-0.5 rounded-lg transition-colors ${
                                                    isGroupActive && selectedFinish === 'foil'
                                                        ? 'bg-purple-500/25 ring-1 ring-purple-400/60'
                                                        : 'hover:bg-purple-500/15'
                                                }`}
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-wider text-purple-300">
                                                    FOIL {group.normal ? `(${group.foil.stock || 0})` : ''}
                                                </span>
                                                <span className="text-xs font-black font-mono text-white leading-tight">
                                                    {Number(group.foil.price || 0).toFixed(2)} $
                                                </span>
                                            </button>
                                        )}
                                        {group.etched && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectVersion(group.etched.printing_id, 'etched');
                                                }}
                                                className={`flex flex-col items-end px-2 py-0.5 rounded-lg transition-colors ${
                                                    isGroupActive && selectedFinish === 'etched'
                                                        ? 'bg-amber-500/20 ring-1 ring-amber-400/60'
                                                        : 'hover:bg-amber-500/10'
                                                }`}
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
                                                    ETCHED
                                                </span>
                                                <span className="text-xs font-black font-mono text-white leading-tight">
                                                    {Number(group.etched.price || 0).toFixed(2)} $
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-6 text-center text-xs text-neutral-400 font-bold">
                            Sin ediciones disponibles en stock
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
